import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowLeft, Globe, Highlighter, MessageSquare, X, ChevronLeft, Trash2, Check, Pencil } from "lucide-react";
import type { Article } from "./articleData";

type Lang = "en" | "pt";
type AnnType = "highlight" | "comment" | "both";

type Annotation = {
  id: string; lang: Lang; type: AnnType;
  hlColor: string; cmColor: string;
  quote: string; prefix: string; suffix: string; relPos: number;
  note?: string;
  cardTop?: number; // measured after render
};

type ReaderChallenge = { subjectName: string; subjectColor: string; theme: string };

const HL = ["#A8ECEE","#FFE09E","#D4ADDF","#F78EA0","#96E696"];
const CM = ["#22CFD5","#FFC23D","#A35BBF","#EE1B3F","#2CCD2C"];
const SRC: Record<string,string> = { arXiv:"#B91C1C","Semantic Scholar":"#1D4ED8",CORE:"#065F46" };
const CTX = 40;
const SIDEBAR_W = 232;
const CARD_GAP = 8;

function fullText(article: Article, lang: Lang) {
  const a = lang==="pt" ? article.abstractPt : article.abstract;
  const b = lang==="pt" ? (article.contentPt??article.content??[]) : (article.content??[]);
  return [a,...b].join(" ");
}

function serialize(range: Range, root: HTMLElement) {
  const q = range.toString().trim();
  if (!q) return null;
  const pre = document.createRange();
  pre.setStart(root,0); pre.setEnd(range.startContainer,range.startOffset);
  const preStr = pre.toString();
  const post = document.createRange();
  post.setStart(range.endContainer,range.endOffset); post.setEnd(root,root.childNodes.length);
  return { quote:q, prefix:preStr.slice(-CTX), suffix:post.toString().slice(0,CTX),
    relPos: (root.textContent??"").length > 0 ? preStr.length/(root.textContent??"x").length : 0 };
}

function mirrorAnn(ann: Annotation, target: string) {
  const e = target.indexOf(ann.quote);
  if (e!==-1) return { quote:ann.quote, prefix:target.slice(Math.max(0,e-CTX),e), suffix:target.slice(e+ann.quote.length,e+ann.quote.length+CTX) };
  const tp = Math.floor(ann.relPos*target.length);
  const ws = target.lastIndexOf(" ",tp)+1;
  const pe = Math.min(target.length,ws+ann.quote.length+20);
  const ce = target.lastIndexOf(" ",pe);
  if (ce<=ws) return null;
  const q = target.slice(ws,ce).trim();
  return q.length<3 ? null : { quote:q, prefix:target.slice(Math.max(0,ws-CTX),ws), suffix:target.slice(ce,ce+CTX) };
}

// ── Para ───────────────────────────────────────────────────────────────────

function Para({ text, anns, onMark }: { text: string; anns: Annotation[]; onMark:(id:string)=>void }) {
  if (!anns.length) return <>{text}</>;
  const hits: {start:number;end:number;ann:Annotation}[] = [];
  for (const ann of anns) {
    for (const needle of [ann.prefix+ann.quote, ann.quote]) {
      const i = text.indexOf(needle); if (i===-1) continue;
      const s = needle===ann.quote ? i : i+ann.prefix.length;
      const e = s+ann.quote.length; if (e>text.length) continue;
      hits.push({start:s,end:e,ann}); break;
    }
  }
  if (!hits.length) return <>{text}</>;
  hits.sort((a,b)=>a.start-b.start);
  type Slot={start:number;end:number;hl:string|null;cm:string|null;note?:string;id:string};
  const slots:Slot[]=[];
  for (const {start,end,ann} of hits) {
    const ex=slots.find(s=>s.start===start&&s.end===end);
    if (ex) {
      if (ann.type==="highlight"||ann.type==="both") ex.hl=ann.hlColor;
      if (ann.type==="comment"||ann.type==="both") { ex.cm=ann.cmColor; if(ann.note)ex.note=ann.note; }
    } else if (!slots.some(s=>start<s.end&&end>s.start)) {
      slots.push({start,end,
        hl:(ann.type==="highlight"||ann.type==="both")?ann.hlColor:null,
        cm:(ann.type==="comment"||ann.type==="both")?ann.cmColor:null,
        note:ann.note,id:ann.id});
    }
  }
  slots.sort((a,b)=>a.start-b.start);
  const out:React.ReactNode[]=[]; let cur=0;
  for (const sl of slots) {
    if (sl.start>cur) out.push(text.slice(cur,sl.start));
    const isMirror=sl.id.startsWith("mirror-");
    out.push(
      <mark key={sl.id} data-ann-id={sl.id}
        onClick={()=>{ if(!isMirror) onMark(sl.id); }}
        style={{ backgroundColor:sl.hl??"transparent",
          borderBottom:sl.cm?`2.5px solid ${sl.cm}`:"none",
          borderRadius:sl.hl?3:0, padding:sl.hl?"2px 0":"0",
          paddingBottom:sl.cm?2:undefined,
          cursor:isMirror?"default":"pointer" }}>
        {text.slice(sl.start,sl.end)}
      </mark>
    );
    cur=sl.end;
  }
  if (cur<text.length) out.push(text.slice(cur));
  return <>{out}</>;
}

// ── Toolbar ────────────────────────────────────────────────────────────────

function Toolbar({ phase, selType, top, left, onPickType, onBack, onClose, onApply, note, setNote, onSaveNote, onSkipNote }:{
  phase:1|2|3; selType:"highlight"|"comment"; top:number; left:number;
  onPickType:(t:"highlight"|"comment")=>void; onBack:()=>void; onClose:()=>void;
  onApply:(c:string)=>void; note:string; setNote:(v:string)=>void;
  onSaveNote:()=>void; onSkipNote:()=>void;
}) {
  const pill:React.CSSProperties={
    background:"var(--card)",border:"1px solid var(--border)",
    borderRadius:12,display:"flex",alignItems:"center",padding:"3px 4px",gap:2,
    position:"relative",
  };
  const b:React.CSSProperties={
    display:"flex",alignItems:"center",gap:5,
    fontFamily:"Inter",fontSize:"0.78rem",fontWeight:600,
    color:"var(--foreground)",background:"transparent",
    border:"none",cursor:"pointer",padding:"5px 10px",borderRadius:8,
  };
  const sep=<div style={{width:1,height:16,background:"var(--border)",flexShrink:0,margin:"0 2px"}}/>;
  const hov={
    e:(e:React.MouseEvent<HTMLButtonElement>)=>(e.currentTarget.style.background="var(--muted)"),
    l:(e:React.MouseEvent<HTMLButtonElement>)=>(e.currentTarget.style.background="transparent"),
  };
  const ARR=7;
  const arrow=(
    <svg width={ARR*2} height={ARR} viewBox={`0 0 ${ARR*2} ${ARR}`}
      style={{position:"absolute",bottom:-(ARR-1),left:"50%",transform:"translateX(-50%)"}} fill="none">
      <path d={`M0 0 L${ARR} ${ARR} L${ARR*2} 0`} fill="var(--card)" stroke="var(--border)" strokeWidth="1"
        style={{clipPath:`inset(0 0 -2px 0)`}}/>
    </svg>
  );

  if (phase===3) return (
    <div onMouseDown={e=>e.preventDefault()} style={{
      position:"fixed",top,left,transform:"translateX(-50%) translateY(-100%) translateY(-10px)",
      zIndex:9999,filter:"drop-shadow(0 4px 16px rgba(17,24,39,0.13))",
    }}>
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,
        padding:14,minWidth:256,position:"relative"}}>
        <p style={{fontFamily:"Inter",fontSize:"0.72rem",fontWeight:600,color:"var(--muted-foreground)",marginBottom:8}}>
          Adicionar nota <span style={{fontWeight:400,opacity:0.65}}>(opcional)</span>
        </p>
        <textarea value={note} onChange={e=>setNote(e.target.value)} autoFocus rows={3}
          placeholder="Sua anotação sobre o trecho..."
          style={{fontFamily:"Inter",fontSize:"0.8rem",color:"var(--foreground)",
            background:"var(--input)",border:"1px solid var(--border)",borderRadius:10,
            padding:"8px 10px",resize:"none",outline:"none",lineHeight:1.6,
            boxSizing:"border-box",width:"100%"}}/>
        <div style={{display:"flex",gap:6,marginTop:10,justifyContent:"flex-end"}}>
          <button onClick={onSkipNote} style={{...b,padding:"5px 12px",color:"var(--muted-foreground)",background:"var(--muted)",border:"1px solid var(--border)"}}>Pular</button>
          <button onClick={onSaveNote} style={{...b,padding:"5px 14px",color:"var(--background)",background:"var(--foreground)"}}>Salvar</button>
        </div>
        {arrow}
      </div>
    </div>
  );

  return (
    <div onMouseDown={e=>e.preventDefault()} style={{
      position:"fixed",top,left,transform:"translateX(-50%) translateY(-100%) translateY(-10px)",
      zIndex:9999,filter:"drop-shadow(0 4px 16px rgba(17,24,39,0.13))",
    }}>
      <div style={{position:"relative"}}>
        {phase===1 && (
          <div style={pill}>
            <button style={b} onMouseEnter={hov.e} onMouseLeave={hov.l} onClick={()=>onPickType("highlight")}>
              <Highlighter size={13} strokeWidth={2}/> Grifo
            </button>
            {sep}
            <button style={b} onMouseEnter={hov.e} onMouseLeave={hov.l} onClick={()=>onPickType("comment")}>
              <MessageSquare size={13} strokeWidth={2}/> Comentário
            </button>
            {sep}
            <button style={{...b,padding:"5px 7px",color:"var(--muted-foreground)"}} onMouseEnter={hov.e} onMouseLeave={hov.l} onClick={onClose}>
              <X size={13} strokeWidth={2}/>
            </button>
            {arrow}
          </div>
        )}
        {phase===2 && (
          <div style={pill}>
            <button style={{...b,padding:"5px 7px",color:"var(--muted-foreground)"}} onMouseEnter={hov.e} onMouseLeave={hov.l} onClick={onBack}>
              <ChevronLeft size={13} strokeWidth={2}/>
            </button>
            {sep}
            <span style={{fontFamily:"Inter",fontSize:"0.7rem",color:"var(--muted-foreground)",padding:"0 4px",whiteSpace:"nowrap"}}>
              {selType==="highlight"?"Cor do grifo":"Cor da linha"}
            </span>
            <div style={{display:"flex",gap:5,padding:"0 4px"}}>
              {(selType==="highlight"?HL:CM).map(c=>(
                <button key={c} onClick={()=>onApply(c)} style={{
                  width:20,height:20,borderRadius:"50%",background:c,flexShrink:0,
                  border:`2px solid ${c==="#FFE09E"?"rgba(17,24,39,0.15)":c}`,cursor:"pointer",
                  transition:"transform 0.1s,box-shadow 0.1s"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.18)";e.currentTarget.style.boxShadow=`0 0 0 3px ${c}55`}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="none"}}
                />
              ))}
            </div>
            {sep}
            <button style={{...b,padding:"5px 7px",color:"var(--muted-foreground)"}} onMouseEnter={hov.e} onMouseLeave={hov.l} onClick={onClose}>
              <X size={13} strokeWidth={2}/>
            </button>
            {arrow}
          </div>
        )}
      </div>
    </div>
  );
}

// ── AnnCard ────────────────────────────────────────────────────────────────

function AnnCard({ ann, editing, onEdit, onClose, onUpdateHl, onUpdateCm, onUpdateNote, onDelete }:{
  ann:Annotation; editing:boolean;
  onEdit:()=>void; onClose:()=>void;
  onUpdateHl:(c:string)=>void; onUpdateCm:(c:string)=>void;
  onUpdateNote:(n:string)=>void; onDelete:()=>void;
}) {
  const [localNote,setLocalNote]=useState(ann.note??"");
  useEffect(()=>{ setLocalNote(ann.note??""); },[ann.note,editing]);

  return (
    <div data-sidebar-card onClick={()=>!editing&&onEdit()} style={{
      position:"relative",
      background:"var(--card)",border:"1px solid var(--border)",
      borderRadius:14,padding:editing?"14px":"10px 12px",
      cursor:editing?"default":"pointer",
      boxShadow:editing?"0 4px 24px rgba(17,24,39,0.1)":"none",
      transition:"box-shadow 0.15s,padding 0.12s",
    }}>
      {editing&&(
        <button onClick={e=>{ e.stopPropagation(); onClose(); }} style={{
          position:"absolute",top:10,right:10,
          display:"flex",alignItems:"center",justifyContent:"center",
          width:22,height:22,borderRadius:"50%",
          background:"var(--muted)",border:"none",cursor:"pointer",
          color:"var(--muted-foreground)",
        }}><X size={11} strokeWidth={2}/></button>
      )}
      <p style={{fontFamily:"Georgia,serif",fontSize:"0.74rem",fontStyle:"italic",
        color:"var(--muted-foreground)",lineHeight:1.5,
        marginBottom:editing?10:4,paddingRight:editing?28:0,
        overflow:"hidden",display:"-webkit-box",
        WebkitLineClamp:editing?999:2,WebkitBoxOrient:"vertical"}}>
        "{ann.quote}"
      </p>
      {!editing&&(
        <>
          {ann.note&&<p style={{fontFamily:"Inter",fontSize:"0.72rem",color:"var(--foreground)",
            lineHeight:1.4,overflow:"hidden",display:"-webkit-box",
            WebkitLineClamp:2,WebkitBoxOrient:"vertical",marginBottom:6}}>{ann.note}</p>}
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            {ann.hlColor&&<div style={{width:8,height:8,borderRadius:"50%",background:ann.hlColor,border:"1px solid rgba(17,24,39,0.12)",flexShrink:0}}/>}
            {ann.cmColor&&<div style={{width:8,height:8,borderRadius:2,background:ann.cmColor+"33",border:`2px solid ${ann.cmColor}`,flexShrink:0}}/>}
            <span style={{fontFamily:"Inter",fontSize:"0.6rem",color:"var(--muted-foreground)",textTransform:"uppercase",letterSpacing:"0.05em"}}>
              {ann.type==="both"?"Grifo + comentário":ann.type==="highlight"?"Grifo":"Comentário"}
            </span>
            <Pencil size={9} color="var(--muted-foreground)" style={{marginLeft:"auto"}}/>
          </div>
        </>
      )}
      {editing&&(
        <>
          {(ann.type==="highlight"||ann.type==="both")&&(
            <div style={{marginBottom:10}}>
              <p style={{fontFamily:"Inter",fontSize:"0.62rem",fontWeight:600,color:"var(--muted-foreground)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Cor do grifo</p>
              <div style={{display:"flex",gap:5}}>
                {HL.map(c=>(
                  <button key={c} onClick={()=>onUpdateHl(c)} style={{
                    width:20,height:20,borderRadius:"50%",background:c,border:"none",cursor:"pointer",flexShrink:0,
                    outline:ann.hlColor===c?"2.5px solid var(--foreground)":"2px solid transparent",outlineOffset:2}}/>
                ))}
              </div>
            </div>
          )}
          {(ann.type==="comment"||ann.type==="both")&&(
            <div style={{marginBottom:10}}>
              <p style={{fontFamily:"Inter",fontSize:"0.62rem",fontWeight:600,color:"var(--muted-foreground)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Cor do comentário</p>
              <div style={{display:"flex",gap:5}}>
                {CM.map(c=>(
                  <button key={c} onClick={()=>onUpdateCm(c)} style={{
                    width:20,height:20,borderRadius:"50%",background:c,border:"none",cursor:"pointer",flexShrink:0,
                    outline:ann.cmColor===c?"2.5px solid var(--foreground)":"2px solid transparent",outlineOffset:2}}/>
                ))}
              </div>
            </div>
          )}
          {(ann.type==="comment"||ann.type==="both")&&(
            <div style={{marginBottom:12}}>
              <p style={{fontFamily:"Inter",fontSize:"0.62rem",fontWeight:600,color:"var(--muted-foreground)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Nota</p>
              <textarea value={localNote} onChange={e=>setLocalNote(e.target.value)}
                placeholder="Sua anotação..." rows={3} autoFocus
                style={{width:"100%",fontFamily:"Inter",fontSize:"0.78rem",color:"var(--foreground)",
                  background:"var(--input)",border:"1px solid var(--border)",borderRadius:10,
                  padding:"7px 9px",resize:"none",outline:"none",lineHeight:1.55,boxSizing:"border-box"}}/>
            </div>
          )}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <button onClick={onDelete} style={{
              display:"flex",alignItems:"center",justifyContent:"center",
              width:28,height:28,borderRadius:"50%",background:"#EE1B3F18",
              border:"none",cursor:"pointer",color:"#EE1B3F",flexShrink:0}}>
              <Trash2 size={12} strokeWidth={2}/>
            </button>
            <button onClick={()=>onUpdateNote(localNote)} style={{
              display:"flex",alignItems:"center",justifyContent:"center",
              width:28,height:28,borderRadius:"50%",background:"var(--foreground)",
              border:"none",cursor:"pointer",color:"var(--background)",flexShrink:0}}>
              <Check size={12} strokeWidth={2.5}/>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── ReaderView ─────────────────────────────────────────────────────────────

export function ReaderView({ article, challenge, setView }:{
  article:Article; challenge:ReaderChallenge|null; setView:(v:any)=>void;
}) {
  const [isTranslated,setIsTranslated]=useState(false);
  const lang:Lang=isTranslated?"pt":"en";
  const [anns,setAnns]=useState<Annotation[]>([]);
  const [editId,setEditId]=useState<string|null>(null);

  const rendered=(()=>{
    const own=anns.filter(a=>a.lang===lang);
    const other=anns.filter(a=>a.lang!==lang);
    const ft=fullText(article,lang);
    const mirrored:Annotation[]=other.map(a=>{
      const m=mirrorAnn(a,ft);
      return m?{...a,...m,id:`mirror-${a.id}`,lang}:null;
    }).filter(Boolean) as Annotation[];
    return [...own,...mirrored];
  })();

  type Phase=1|2|3;
  const [phase,setPhase]=useState<Phase>(1);
  const [open,setOpen]=useState(false);
  const [stype,setStype]=useState<"highlight"|"comment">("highlight");
  const [cap,setCap]=useState<ReturnType<typeof serialize>|null>(null);
  const [pid,setPid]=useState<string|null>(null);
  const [note,setNote]=useState("");
  const [tbTop,setTbTop]=useState(0);
  const [tbLeft,setTbLeft]=useState(0);

  // sidebar card tops — measured after render
  const [cardTops,setCardTops]=useState<Record<string,number>>({});
  const bodyRef=useRef<HTMLDivElement>(null); // the full scrollable body
  const contentRef=useRef<HTMLDivElement>(null);

  // Measure mark positions — relative to contentRef top
  useEffect(()=>{
    if (!contentRef.current) return;
    const measure=()=>{
      const containerRect=contentRef.current!.getBoundingClientRect();
      const tops:Record<string,number>={};
      // Measure originals
      for (const ann of anns) {
        const el=contentRef.current!.querySelector(`[data-ann-id="${ann.id}"]`) as HTMLElement|null;
        if (el) {
          const rect=el.getBoundingClientRect();
          tops[ann.id]=rect.top - containerRect.top;
        }
      }
      // Measure mirrors (translated positions) — store under original id
      for (const ann of anns) {
        const mirrorEl=contentRef.current!.querySelector(`[data-ann-id="mirror-${ann.id}"]`) as HTMLElement|null;
        if (mirrorEl) {
          const rect=mirrorEl.getBoundingClientRect();
          tops[ann.id]=rect.top - containerRect.top; // override with mirror position
        }
      }
      setCardTops(tops);
    };
    const t=setTimeout(measure,80);
    return ()=>clearTimeout(t);
  },[anns,lang,isTranslated]);

  // Compute stacked positions — cards can't overlap each other
  const own=anns.filter(a=>a.lang===lang);
  const positionedCards=own.map(ann=>{
    const natural=cardTops[ann.id]??0;
    return {ann, natural};
  });
  // stack: each card must start below previous card + gap
  const CARD_H=(editing:boolean)=>editing?180:80; // rough height estimates
  const stacked:Array<{ann:Annotation;top:number}>=[];
  let minNext=0;
  for (const {ann,natural} of positionedCards) {
    const top=Math.max(natural,minNext);
    stacked.push({ann,top});
    minNext=top+CARD_H(editId===ann.id)+CARD_GAP;
  }

  // sidebar total height — show all annotations regardless of lang
  // (they appear at the position of their mark, whether original or mirrored)
  const allSourceAnns = anns; // always show all
  const stackedAll = allSourceAnns.map(ann => ({
    ann,
    natural: cardTops[ann.id] ?? 0,
  }));
  stackedAll.sort((a,b) => a.natural - b.natural);
  const stackedFinal: Array<{ann:Annotation;top:number}> = [];
  let minNextAll = 0;
  for (const {ann, natural} of stackedAll) {
    const top = Math.max(natural, minNextAll);
    stackedFinal.push({ann, top});
    minNextAll = top + CARD_H(editId === ann.id) + CARD_GAP;
  }
  const sidebarH = stackedFinal.length > 0
    ? stackedFinal[stackedFinal.length-1].top + CARD_H(editId===stackedFinal[stackedFinal.length-1].ann.id) + 16
    : 0;

  useEffect(()=>{
    if(open) document.body.style.overflow="hidden";
    else document.body.style.overflow="";
    return ()=>{ document.body.style.overflow=""; };
  },[open]);

  const handleSel=useCallback((e:React.MouseEvent)=>{
    if(open||editId) return;
    setTimeout(()=>{
      const sel=window.getSelection();
      if(!sel||sel.isCollapsed||!contentRef.current) return;
      const txt=sel.toString().trim();
      if(txt.length<3||!contentRef.current.contains(sel.anchorNode)) return;
      const range=sel.getRangeAt(0);
      const s=serialize(range,contentRef.current);
      if(!s) return;
      const rect=range.getBoundingClientRect();
      setCap(s);
      setTbLeft(rect.left+rect.width/2);
      setTbTop(rect.top);
      setPhase(1); setOpen(true);
    },10);
  },[open,editId]);

  useEffect(()=>{
    const fn=(e:KeyboardEvent)=>{ if(e.key==="Escape"){ closeT(); setEditId(null); }};
    document.addEventListener("keydown",fn); return ()=>document.removeEventListener("keydown",fn);
  },[]);

  function closeT(){ setOpen(false); setCap(null); window.getSelection()?.removeAllRanges(); }

  function applyColor(color:string){
    if(!cap) return;
    const ex=anns.find(a=>a.lang===lang&&a.quote===cap.quote&&a.prefix===cap.prefix);
    if(ex){
      setAnns(p=>p.map(a=>a.id===ex.id?{...a,type:"both",
        hlColor:stype==="highlight"?color:a.hlColor,
        cmColor:stype==="comment"?color:a.cmColor}:a));
      window.getSelection()?.removeAllRanges();
      if(stype==="comment"){ setPid(ex.id); setNote(""); setPhase(3); }
      else closeT();
    } else {
      const id=Date.now().toString();
      setAnns(p=>[...p,{id,lang,type:stype,hlColor:stype==="highlight"?color:"",cmColor:stype==="comment"?color:"",...cap}]);
      window.getSelection()?.removeAllRanges();
      if(stype==="comment"){ setPid(id); setNote(""); setPhase(3); }
      else closeT();
    }
  }

  function saveNote(){ if(pid&&note.trim()) setAnns(p=>p.map(a=>a.id===pid?{...a,note:note.trim()}:a)); setPid(null); setNote(""); closeT(); }
  function skipNote(){ setPid(null); setNote(""); closeT(); }
  function clickMark(id:string){ if(id.startsWith("mirror-")) return; setEditId(p=>p===id?null:id); }
  function upd(id:string,patch:Partial<Annotation>){ setAnns(p=>p.map(a=>a.id===id?{...a,...patch}:a)); }
  function del(id:string){ setAnns(p=>p.filter(a=>a.id!==id)); setEditId(null); }

  const abs=isTranslated?article.abstractPt:article.abstract;
  const body=isTranslated?(article.contentPt??article.content??[]):(article.content??[]);

  return (
    <div ref={bodyRef} style={{minHeight:"100vh",overflowY:open?"hidden":"auto",position:"relative"}}
      onClick={e=>{ const t=e.target as HTMLElement;
        if(!t.closest("[data-ann-id]")&&!t.closest("[data-sidebar-card]")) setEditId(null); }}>

      {/* Header */}
      <div className="sticky top-0 z-10 px-6 pt-6 pb-5"
        style={{background:"var(--background)",borderBottom:"1px solid var(--border)"}}>
        <button onClick={()=>setView("timer")} className="flex items-center gap-1.5 mb-4 hover:opacity-70 transition-opacity"
          style={{fontFamily:"Inter",fontSize:"0.82rem",color:"var(--muted-foreground)",background:"none",border:"none",cursor:"pointer",padding:0}}>
          <ArrowLeft size={15}/> Artigos
        </button>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {challenge&&<span style={{fontFamily:"Inter",fontSize:"0.68rem",fontWeight:600,color:challenge.subjectColor,background:`${challenge.subjectColor}18`,padding:"3px 8px",borderRadius:6}}>{challenge.theme}</span>}
          <span style={{fontFamily:"Inter",fontSize:"0.68rem",fontWeight:600,color:SRC[article.source]??"#374151",background:`${SRC[article.source]??"#374151"}14`,padding:"3px 8px",borderRadius:6}}>{article.source}</span>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.7rem",color:"var(--muted-foreground)",background:"var(--muted)",padding:"3px 8px",borderRadius:6}}>{article.year}</span>
          <span style={{fontFamily:"Inter",fontSize:"0.7rem",color:"var(--muted-foreground)",background:"var(--muted)",padding:"3px 8px",borderRadius:6}}>{article.readTime} min</span>
        </div>
        <h1 style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:"1.2rem",color:"var(--foreground)",lineHeight:1.35,marginBottom:6}}>
          {isTranslated?article.titlePt:article.title}
        </h1>
        <p style={{fontFamily:"Inter",fontSize:"0.78rem",color:"var(--muted-foreground)",marginBottom:12}}>{article.authors.join(", ")}</p>
        <button onClick={()=>setIsTranslated(t=>!t)} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          style={{fontFamily:"Inter",fontSize:"0.78rem",fontWeight:500,color:"var(--muted-foreground)",background:"var(--muted)",border:"1px solid var(--border)",borderRadius:8,padding:"5px 12px",cursor:"pointer"}}>
          <Globe size={13}/> {isTranslated?"Ver original":"Traduzir"}
        </button>
      </div>

      {/* Body: text + sidebar */}
      <div style={{display:"flex",position:"relative"}}>

        {/* Text */}
        <div style={{flex:1,minWidth:0}}>
          <div ref={contentRef} className="px-6 py-8" style={{maxWidth:680,userSelect:"text"}}
            onMouseUp={handleSel}>
            <h2 style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:"0.75rem",color:"var(--muted-foreground)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Resumo</h2>
            <p style={{fontFamily:"Georgia,serif",fontSize:"1rem",lineHeight:1.85,color:"var(--foreground)",marginBottom:article.abstractOnly?20:32}}>
              <Para text={abs} anns={rendered} onMark={clickMark}/>
            </p>
            {article.abstractOnly&&(
              <p style={{fontFamily:"Inter",fontSize:"0.78rem",color:"var(--muted-foreground)",padding:"10px 14px",borderRadius:10,background:"var(--muted)",border:"1px solid var(--border)"}}>
                Apenas o resumo está disponível para este artigo.
              </p>
            )}
            {!article.abstractOnly&&body.length>0&&(
              <>
                <h2 style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:"0.75rem",color:"var(--muted-foreground)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Texto completo</h2>
                {body.map((para,i)=>(
                  <p key={i} style={{fontFamily:"Georgia,serif",fontSize:"1rem",lineHeight:1.85,color:"var(--foreground)",marginBottom:22}}>
                    <Para text={para} anns={rendered} onMark={clickMark}/>
                  </p>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Sidebar — absolutely positioned cards aligned to their marks */}
        {anns.length>0&&(
          <div style={{width:SIDEBAR_W,flexShrink:0,position:"relative",height:sidebarH}}>
            {stackedFinal.map(({ann,top})=>{
              // use mirrored quote if available for current lang
              const mirrorAnn=rendered.find(r=>r.id===`mirror-${ann.id}`);
              const displayAnn=mirrorAnn ? {...ann, quote: mirrorAnn.quote} : ann;
              return (
              <div key={ann.id} style={{position:"absolute",top,left:0,right:12,transition:"top 0.2s ease",zIndex:editId===ann.id?10:1}}>
                <AnnCard ann={displayAnn} editing={editId===ann.id}
                  onEdit={()=>setEditId(ann.id)} onClose={()=>setEditId(null)}
                  onUpdateHl={c=>upd(ann.id,{hlColor:c})}
                  onUpdateCm={c=>upd(ann.id,{cmColor:c})}
                  onUpdateNote={n=>{ upd(ann.id,{note:n||undefined}); setEditId(null); }}
                  onDelete={()=>del(ann.id)}/>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toolbar */}
      {open&&(
        <Toolbar phase={phase} selType={stype} top={tbTop} left={tbLeft}
          onPickType={t=>{ setStype(t); setPhase(2); }}
          onBack={()=>setPhase(1)} onClose={closeT} onApply={applyColor}
          note={note} setNote={setNote} onSaveNote={saveNote} onSkipNote={skipNote}/>
      )}
    </div>
  );
}