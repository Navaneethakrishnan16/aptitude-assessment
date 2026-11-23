export interface Candidate {
  id: number;
  full_name: string;
  email: string;
  age: number;
  phone: string;
  gender?: string | null;
  qualification: string;
  city?: string | null;
}

export interface CandidateForm {
  full_name: string;
  email: string;
  age: string;
  phone: string;
  gender: string;
  qualification: string;
  city: string;
}

export interface QuestionPublic {
  id: number;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

export interface StartTestResponse {
  attempt_id: number;
  duration_minutes: number;
  pass_percentage: number;
  marking_scheme: { correct: number; wrong: number; unattempted: number };
  questions: QuestionPublic[];
}

export interface AttemptResult {
  attempt_id: number;
  candidate_name: string;
  score: number;
  percentage: number;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
  marks_deducted: number;
  time_taken_seconds: number;
  status: "Pass" | "Fail";
}

export type QuestionStatus = "unanswered" | "answered" | "marked";
