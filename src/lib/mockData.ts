export interface Listing {
  id: string;
  title: string;
  price: number;
  initialPrice?: number;
  type: "sale" | "rent" | "event" | "food";
  category: string;
  image: string;
  images?: string[];
  seller: string;
  sellerAvatar: string;
  university: string;
  campus?: string;
  level: string;
  rentPeriod?: string;
  description: string;
  callNumber?: string;
  whatsappNumber?: string;
  callNumber2?: string;
  ticketsLeft?: number;
  eventDate?: string;
  available?: boolean;
}

export interface Event {
  id: string;
  title: string;
  image: string;
  price: number;
  university: string;
  date: string;
  time: string;
  venue: string;
  ticketsLeft: number;
  callNumber: string;
  whatsappNumber: string;
}

export interface Story {
  id: string;
  user: string;
  avatar: string;
  thumbnail: string;
  university: string;
  timeAgo: string;
  viewed: boolean;
}

export const LISTINGS: Listing[] = [];

export interface FoodItem {
  id: string;
  name: string;
  price: number;
  specialty: string;
  description: string;
  image: string;
  university: string;
  rating: number;
  reviews: number;
  available: boolean;
  tags: string[];
  callNumber?: string;
  whatsappNumber?: string;
}

export const FOOD_LISTINGS: FoodItem[] = [];

export const EVENTS: Event[] = [
  {
    id: "1",
    title: "Campus Music Festival 2025",
    image: "https://images.unsplash.com/photo-1459749411177-0473ef716175?w=600&h=400&fit=crop",
    price: 50,
    university: "University of Ghana",
    date: "2025-08-15",
    time: "18:00",
    venue: "Great Hall",
    ticketsLeft: 120,
    callNumber: "+233 24 111 2222",
    whatsappNumber: "+233 24 111 2222"
  },
  {
    id: "2",
    title: "Tech Career Fair",
    image: "https://images.unsplash.com/photo-1540575467062-7c04afeb9e5e?w=600&h=400&fit=crop",
    price: 0,
    university: "KNUST",
    date: "2025-09-20",
    time: "09:00",
    venue: "Auditorium",
    ticketsLeft: 50,
    callNumber: "+233 30 222 3333",
    whatsappNumber: "+233 30 222 3333"
  },
  {
    id: "3",
    title: "Entrepreneurship Workshop",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop",
    price: 30,
    university: "Ashesi University",
    date: "2025-10-05",
    time: "10:00",
    venue: "Innovation Hub",
    ticketsLeft: 80,
    callNumber: "+233 27 333 4444",
    whatsappNumber: "+233 27 333 4444"
  },
  {
    id: "4",
    title: "Sports Extravaganza",
    image: "https://images.unsplash.com/photo-1461896836934- voices-8?w=600&h=400&fit=crop",
    price: 20,
    university: "University of Cape Coast",
    date: "2025-11-12",
    time: "14:00",
    venue: "Sports Complex",
    ticketsLeft: 200,
    callNumber: "+233 33 444 5555",
    whatsappNumber: "+233 33 444 5555"
  }
];

export const STORIES: Story[] = [
  {
    id: "1",
    user: "Ama Mensah",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop",
    thumbnail: "https://images.unsplash.com/photo-1523050854058-8df90110a7f1?w=600&h=800&fit=crop",
    university: "University of Ghana",
    timeAgo: "2 hours ago",
    viewed: false
  },
  {
    id: "2",
    user: "Kofi Asante",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    thumbnail: "https://images.unsplash.com/photo-1541339907198-e08756dedf3a?w=600&h=800&fit=crop",
    university: "KNUST",
    timeAgo: "5 hours ago",
    viewed: false
  },
  {
    id: "3",
    user: "Fatima Ibrahim",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    thumbnail: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&h=800&fit=crop",
    university: "Ashesi University",
    timeAgo: "1 day ago",
    viewed: true
  }
];