"use client";

import { useState } from "react";
import {
  Heart,
  GraduationCap,
  Leaf,
  AlertTriangle,
  Cat,
  Users,
  Briefcase,
  PlusCircle,
  Sparkles,
  CalendarCheck,
  Building2,
  Bell,
  CloudOff,
  HeartHandshake,
  Trophy,
  Plane,
  UserPlus,
  Laptop,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Category item type definition
export interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
}

// Props for the CategorySidebar component
interface CategorySidebarProps {
  onCategorySelect?: (categoryId: string) => void;
  selectedCategory?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// List of all available categories with their icons
const CATEGORIES: Category[] = [
  { id: "all", name: "All", icon: <CheckSquare size={20} /> },
  {
    id: "health-medical",
    name: "Health and Medical",
    icon: <Heart size={20} />,
  },
  { id: "education", name: "Education", icon: <GraduationCap size={20} /> },
  { id: "environment", name: "Environment", icon: <Leaf size={20} /> },
  { id: "emergency", name: "Emergency", icon: <AlertTriangle size={20} /> },
  { id: "animal", name: "Animal", icon: <Cat size={20} /> },
  { id: "community", name: "Community", icon: <Users size={20} /> },
  { id: "business", name: "Business", icon: <Briefcase size={20} /> },
  { id: "competition", name: "Competition", icon: <PlusCircle size={20} /> },
  { id: "creative", name: "Creative", icon: <Sparkles size={20} /> },
  { id: "event", name: "Event", icon: <CalendarCheck size={20} /> },
  { id: "religion", name: "Religion", icon: <Building2 size={20} /> },
  { id: "memorial", name: "Memorial", icon: <Bell size={20} /> },
  { id: "disaster", name: "Disaster", icon: <CloudOff size={20} /> },
  { id: "family", name: "Family", icon: <HeartHandshake size={20} /> },
  { id: "sports", name: "Sports", icon: <Trophy size={20} /> },
  { id: "travel", name: "Travel", icon: <Plane size={20} /> },
  { id: "volunteer", name: "Volunteer", icon: <UserPlus size={20} /> },
  { id: "tech-startups", name: "Tech Startups", icon: <Laptop size={20} /> },
];

/**
 * CategorySidebar - A collapsible sidebar component for browsing campaign categories
 * Displays a list of categories with icons that users can click to filter campaigns
 */
export default function CategorySidebar({
  onCategorySelect,
  selectedCategory = "all",
  isCollapsed = false,
  onToggleCollapse,
}: CategorySidebarProps) {
  const [activeCategory, setActiveCategory] = useState(selectedCategory);

  // Handle category selection
  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    onCategorySelect?.(categoryId);
  };

  return (
    <aside
      className={`h-full overflow-y-auto scrollbar-auto-hide flex-shrink-0 transition-all duration-300 border-r border-white/10 hidden md:block ${
        isCollapsed ? "md:w-[60px]" : "md:w-[200px] lg:w-[240px]"
      }`}
    >
      <div className="flex flex-col gap-5 py-2 pr-4">
        {/* Header with title and collapse toggle */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between px-1">
            <h2 className="font-semibold text-lg text-white tracking-[0.36px] font-[family-name:var(--font-family-gilgan)]">
              Browse Categories
            </h2>
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={18} className="text-white/60" />
            </button>
          </div>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="flex items-center justify-center p-2 rounded-lg hover:bg-white/5 transition-colors mx-auto"
            aria-label="Expand sidebar"
          >
            <ChevronRight size={18} className="text-white/60" />
          </button>
        )}

        {/* Categories List */}
        <div className="flex flex-col gap-1">
          {CATEGORIES.map((category) => {
            const isActive = activeCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  isCollapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-gradient-to-r from-primary-500 to-soft-purple-500 shadow-md"
                    : "hover:bg-white/5"
                }`}
                title={isCollapsed ? category.name : undefined}
              >
                {/* Category Icon */}
                <span
                  className={`flex-shrink-0 transition-colors ${
                    isActive ? "text-white" : "text-white/70"
                  }`}
                >
                  {category.icon}
                </span>

                {/* Category Name - Hidden when collapsed */}
                {!isCollapsed && (
                  <span
                    className={`text-sm leading-5 tracking-[0.28px] whitespace-nowrap transition-colors ${
                      isActive ? "text-white font-medium" : "text-white/70"
                    }`}
                  >
                    {category.name}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
