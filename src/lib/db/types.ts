export type ProfileRole = "user" | "admin";

export type Profile = {
  id: string;
  email: string;
  role: ProfileRole;
  charityId: string | null;
  contributionPercent: number | null;
};

export type Charity = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  featured: boolean;
};

export type Subscription = {
  id: string;
  profileId: string;
  planType: "monthly" | "yearly";
  status: "active" | "inactive" | "canceled";
  renewalDate: string | null;
};

export type Score = {
  id: string;
  profileId: string;
  scoreDate: string; // ISO date YYYY-MM-DD
  stablefordScore: number;
};

