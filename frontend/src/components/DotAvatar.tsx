import { BRAND } from "@/domain/brand";
import svgGlassesP from "@/assets/accessories/glasses";
import svgPartyHatP from "@/assets/accessories/party-hat";
import svgWitchHatP from "@/assets/accessories/witch-hat";

export function DotAvatar({
  color,
  accessory,
  size = 48,
}: {
  color: string;
  accessory?: string | null;
  size?: number;
}) {
  const s = size,
    cx = s / 2,
    cy = s / 2,
    r = s * 0.45;
  const filterId = "inner-shadow-" + color.replace("#", "");

  // Figma hat positioning — scale so brim width matches dot proportions
  const hatBaseScale = r / 61.67;
  const brimCenterY = cy - r * 0.8;
  const bowlerTx = cx - 96.5 * hatBaseScale;
  const bowlerTy = brimCenterY - 86 * hatBaseScale;
  const witchTx = cx - 95.9953 * hatBaseScale;
  const witchTy = brimCenterY - 168.984 * hatBaseScale;
  const partyScale = r / 57;
  const partyTx = cx - 38.5 * partyScale;
  const partyTy = cy - r * 0.9 - 119 * partyScale;
  const shadesScale = (1.8 * r) / 129;
  const shadesTx = cx - 70 * shadesScale;
  const shadesTy = cy - 22.5 * shadesScale;
  const partyClipId = `party-clip-${color.replace("#", "")}-${size}`;

  return (
    <svg width={s} height={s} viewBox={"0 0 " + s + " " + s} fill="none" className="overflow-visible">
      <defs>
        <filter colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%" id={filterId}>
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dx={s * 0.04} dy={s * 0.04} />
          <feGaussianBlur stdDeviation={s * 0.04} />
          <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend in2="shape" mode="normal" result="effect1_innerShadow" />
        </filter>
        <filter id="drop-shadow-acc" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy={s * 0.03} stdDeviation={s * 0.04} floodColor="#000" floodOpacity="0.25" />
        </filter>
        {accessory === "party" && (
          <clipPath id={partyClipId}>
            <path d={svgPartyHatP.p307dd730} transform={`translate(${partyTx},${partyTy}) scale(${partyScale})`} />
            <path d={svgPartyHatP.p3d17100} transform={`translate(${partyTx},${partyTy}) scale(${partyScale})`} />
          </clipPath>
        )}
      </defs>

      {/* Outer shadow for the dot itself to pop from background slightly */}
      <circle cx={cx} cy={cy + s * 0.02} r={r} fill="rgba(0,0,0,0.15)" filter="blur(2px)" />

      {/* The Dot (Bolinha) */}
      <circle cx={cx} cy={cy} r={r} fill={color} filter={"url(#" + filterId + ")"} />

      {/* Eyes */}
      <circle cx={cx - r * 0.28} cy={cy} r={r * 0.1} fill="#111827" />
      <circle cx={cx + r * 0.28} cy={cy} r={r * 0.1} fill="#111827" />

      {/* Accessories */}
      {accessory === "hat" && (
        <g filter="url(#drop-shadow-acc)">
          {/* Cap peak */}
          <ellipse cx={cx} cy={cy - r * 0.4} rx={r * 1.55} ry={r * 0.45} fill="#414141" />
          {/* Cap bottom red stripe */}
          <ellipse cx={cx} cy={cy - r * 0.55} rx={r * 0.75} ry={r * 0.2} fill="#EE1B3F" />
          {/* Cap dome */}
          <path
            d={
              "M " +
              (cx - r * 0.65) +
              " " +
              (cy - r * 0.6) +
              " L " +
              (cx - r * 0.65) +
              " " +
              (cy - r * 1.25) +
              " A " +
              r * 0.65 +
              " " +
              r * 0.65 +
              " 0 0 1 " +
              (cx + r * 0.65) +
              " " +
              (cy - r * 1.25) +
              " L " +
              (cx + r * 0.65) +
              " " +
              (cy - r * 0.6) +
              " Z"
            }
            fill="#414141"
          />
        </g>
      )}
      {accessory === "glasses" && (
        <g filter="url(#drop-shadow-acc)">
          <rect x={cx - r * 0.95} y={cy - r * 0.15} width={r * 0.85} height={r * 0.6} rx={r * 0.2} fill="#111827" />
          <rect x={cx + r * 0.1} y={cy - r * 0.15} width={r * 0.85} height={r * 0.6} rx={r * 0.2} fill="#111827" />
          <line
            x1={cx - r * 0.1}
            y1={cy + r * 0.15}
            x2={cx + r * 0.1}
            y2={cy + r * 0.15}
            stroke="#111827"
            strokeWidth={r * 0.15}
          />
        </g>
      )}
      {accessory === "crown" && (
        <path
          filter="url(#drop-shadow-acc)"
          d={
            "M " +
            (cx - r * 0.9) +
            " " +
            (cy - r * 0.4) +
            " L " +
            (cx - r * 0.6) +
            " " +
            (cy - r * 1.3) +
            " L " +
            cx +
            " " +
            (cy - r * 0.8) +
            " L " +
            (cx + r * 0.6) +
            " " +
            (cy - r * 1.3) +
            " L " +
            (cx + r * 0.9) +
            " " +
            (cy - r * 0.4) +
            " Z"
          }
          fill={BRAND.yellow}
          stroke="#B48600"
          strokeWidth={r * 0.05}
        />
      )}
      {accessory === "halo" && (
        <ellipse
          filter="url(#drop-shadow-acc)"
          cx={cx}
          cy={cy - r * 1.1}
          rx={r * 0.9}
          ry={r * 0.25}
          fill="none"
          stroke={BRAND.yellow}
          strokeWidth={r * 0.2}
        />
      )}
      {accessory === "bow" && (
        <g filter="url(#drop-shadow-acc)">
          <path
            d={
              "M " +
              (cx - r * 0.8) +
              " " +
              (cy - r * 0.8) +
              " Q " +
              (cx - r * 0.3) +
              " " +
              (cy - r * 0.5) +
              " " +
              cx +
              " " +
              (cy - r * 0.75) +
              " Q " +
              (cx - r * 0.3) +
              " " +
              (cy - r * 1.0) +
              " " +
              (cx - r * 0.8) +
              " " +
              (cy - r * 0.8) +
              " Z"
            }
            fill={BRAND.red}
          />
          <path
            d={
              "M " +
              (cx + r * 0.8) +
              " " +
              (cy - r * 0.8) +
              " Q " +
              (cx + r * 0.3) +
              " " +
              (cy - r * 0.5) +
              " " +
              cx +
              " " +
              (cy - r * 0.75) +
              " Q " +
              (cx + r * 0.3) +
              " " +
              (cy - r * 1.0) +
              " " +
              (cx + r * 0.8) +
              " " +
              (cy - r * 0.8) +
              " Z"
            }
            fill={BRAND.red}
          />
          <circle cx={cx} cy={cy - r * 0.75} r={r * 0.2} fill="#b91c1c" />
        </g>
      )}
      {accessory === "horns" && (
        <g filter="url(#drop-shadow-acc)">
          <path
            d={
              "M " +
              (cx - r * 0.4) +
              " " +
              (cy - r * 0.3) +
              " Q " +
              (cx - r * 0.9) +
              " " +
              (cy - r * 0.8) +
              " " +
              (cx - r * 0.8) +
              " " +
              (cy - r * 1.2) +
              " Q " +
              (cx - r * 0.5) +
              " " +
              (cy - r * 0.8) +
              " " +
              (cx - r * 0.1) +
              " " +
              (cy - r * 0.3) +
              " Z"
            }
            fill={BRAND.red}
          />
          <path
            d={
              "M " +
              (cx + r * 0.4) +
              " " +
              (cy - r * 0.3) +
              " Q " +
              (cx + r * 0.9) +
              " " +
              (cy - r * 0.8) +
              " " +
              (cx + r * 0.8) +
              " " +
              (cy - r * 1.2) +
              " Q " +
              (cx + r * 0.5) +
              " " +
              (cy - r * 0.8) +
              " " +
              (cx + r * 0.1) +
              " " +
              (cy - r * 0.3) +
              " Z"
            }
            fill={BRAND.red}
          />
        </g>
      )}

      {/* Bowler Hat (Group28-1) */}
      {accessory === "bowler" && (
        <g transform={`translate(${bowlerTx},${bowlerTy}) scale(${hatBaseScale})`}>
          <ellipse cx="96.5" cy="86" fill="#414141" rx="92.5" ry="28" />
          <ellipse cx="99" cy="79.5" fill="#EE1B3F" rx="44" ry="11.5" />
          <ellipse cx="98.5" cy="76.5" fill="#414141" rx="38.5" ry="9.5" />
          <rect fill="#414141" height="38" width="77" x="60" y="39" />
          <circle cx="98.5" cy="38.5" fill="#414141" r="38.5" />
        </g>
      )}

      {/* Witch Hat (Group29-2) */}
      {accessory === "witch" && (
        <g transform={`translate(${witchTx},${witchTy}) scale(${hatBaseScale})`}>
          <path d={svgWitchHatP.pbc42a00} fill="#414141" />
          <path d={svgWitchHatP.p3b5dc600} fill="#414141" />
          <ellipse
            cx="95.9953"
            cy="168.984"
            fill="#414141"
            rx="92.5"
            ry="28"
            transform="rotate(-6.28995 95.9953 168.984)"
          />
          <ellipse
            cx="94.0232"
            cy="151.092"
            fill="#A35BBF"
            rx="58.5"
            ry="24"
            transform="rotate(-6.28995 94.0232 151.092)"
          />
          <ellipse
            cx="93.5342"
            cy="142.092"
            fill="#414141"
            rx="46"
            ry="15"
            transform="rotate(-6.28995 93.5342 142.092)"
          />
        </g>
      )}

      {/* Party Hat (Group27-1 — cone only) */}
      {accessory === "party" && (
        <g>
          <g transform={`translate(${partyTx},${partyTy}) scale(${partyScale})`}>
            <path d={svgPartyHatP.p307dd730} fill="#FFC23D" />
            <path d={svgPartyHatP.p3d17100} fill="#FFC23D" />
          </g>
          <g clipPath={`url(#${partyClipId})`}>
            <g transform={`translate(${partyTx},${partyTy}) scale(${partyScale})`}>
              <ellipse cx="-0.890625" cy="102.5" fill="#22CFD5" rx="6.10938" ry="8.5" />
              <ellipse cx="14.9219" cy="62.5" fill="#A35BBF" rx="6.10938" ry="8.5" />
              <ellipse cx="45.1094" cy="107.5" fill="#EE1B3F" rx="6.10938" ry="8.5" />
              <ellipse cx="58.7656" cy="71.5" fill="#A35BBF" rx="6.10938" ry="8.5" />
              <ellipse cx="39.1094" cy="8.5" fill="#EE1B3F" rx="6.10938" ry="8.5" />
              <ellipse cx="78.8906" cy="53.5" fill="#22CFD5" rx="6.10938" ry="8.5" />
              <ellipse cx="43.1094" cy="45.5" fill="#2CCD2C" rx="6.10938" ry="8.5" />
              <ellipse cx="17.1094" cy="90.5" fill="#2CCD2C" rx="6.10938" ry="8.5" />
              <ellipse cx="37.1094" cy="76.5" fill="#22CFD5" rx="6.10938" ry="8.5" />
            </g>
          </g>
        </g>
      )}

      {/* Cool Sunglasses (Group26-1) */}
      {accessory === "shades" && (
        <g transform={`translate(${shadesTx},${shadesTy}) scale(${shadesScale})`}>
          <path d={svgGlassesP.p13f25b40} fill="black" stroke="black" strokeWidth="1" />
          <path d={svgGlassesP.p348a2980} fill="black" stroke="black" strokeWidth="1" />
          <line x1="59.7814" y1="24.1192" x2="79.7814" y2="24.1192" stroke="black" strokeWidth="3" />
        </g>
      )}
    </svg>
  );
}
