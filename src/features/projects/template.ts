export type ProjectCategory = "Spaces" | "Programs" | "Tools" | "Community";

export type TemplateProject = {
  id: string;
  title: string;
  organization: string;
  location: string;
  description: string;
  category: ProjectCategory;
  raised: number;
  goal: number;
  supporters: number;
  status: "active" | "funded" | "complete";
  accent: string;
  featured?: boolean;
  image_urls?: string[];
};

export const categories = ["All projects", "Spaces", "Programs", "Tools", "Community"] as const;
export const projectCategories = categories.slice(1);

export const templateProjects: TemplateProject[] = [
  { id: "north-star", title: "The North Star workspace", organization: "Common Ground", location: "Portland, OR", description: "A bright, flexible room for workshops, gatherings, and the ideas that bring people together.", category: "Spaces", raised: 18400, goal: 24000, supporters: 86, status: "active", accent: "photo-harbor", featured: true },
  { id: "open-table", title: "Open table dinners", organization: "Neighbor House", location: "Austin, TX", description: "Monthly meals and conversations that make a new city feel a little more like home.", category: "Community", raised: 9200, goal: 12000, supporters: 54, status: "active", accent: "photo-meadow", featured: true },
  { id: "maker-lab", title: "The maker lab", organization: "Cedar Works", location: "Detroit, MI", description: "Shared tools, patient teaching, and a place to turn a first sketch into something real.", category: "Tools", raised: 31000, goal: 31000, supporters: 142, status: "funded", accent: "photo-sunrise", featured: true },
  { id: "after-school", title: "After-school studio", organization: "Bright Side", location: "Brooklyn, NY", description: "A calm creative program where young people can learn, make, and be seen.", category: "Programs", raised: 6700, goal: 15000, supporters: 38, status: "active", accent: "photo-grove" },
  { id: "garden-room", title: "Garden room", organization: "The Greenhouse", location: "Madison, WI", description: "A small gathering room opening onto a shared garden for classes and quiet work.", category: "Spaces", raised: 22000, goal: 22000, supporters: 108, status: "complete", accent: "photo-meadow" },
  { id: "mobile-library", title: "Mobile library", organization: "Field Notes", location: "Tucson, AZ", description: "A rolling collection of books and resources for neighborhoods without a library nearby.", category: "Programs", raised: 7800, goal: 18000, supporters: 47, status: "active", accent: "photo-harbor" },
];

export function formatMoney(value: number) { return `$${Math.round(value).toLocaleString()}`; }
export function isGoalReachedStatus(status?: string) { return status === "funded" || status === "complete"; }
export function selectFeaturedProjects(projects: TemplateProject[], count: number) { return projects.filter((project) => project.featured).slice(0, count); }