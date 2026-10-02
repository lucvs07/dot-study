import type { Subject, SubjectService, Theme } from "@/services/contracts";
import type { HttpClient } from "./http";

export function createApiSubjectService(http: HttpClient): SubjectService {
  return {
    list: () => http.request<Subject[]>("GET", "/subjects"),
    randomTheme: (subjectId) => http.request<Theme>("GET", `/subjects/${subjectId}/random-theme`),
  };
}
