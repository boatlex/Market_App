export type ApplicationStatus = 'Pending' | 'Reviewed' | 'Interviewing' | 'Hired'
export type WorkMode = 'on-site' | 'remote' | 'hybrid';
export type NotificationType = 'call_me_back' | 'make_an_offer';
export type ReportTargetType = 'product' | 'user' | 'comment';
export type ReportReason = 'scam' | 'inappropriate_content' | 'fake_item' | 'harassment' | 'other';
export type ReportStatus = 'pending' | 'under_review' | 'resolved' | 'dismissed';
export type ReviewRating = 1 | 2 | 3 | 4 | 5;
export type PricingBasis = 'per hour' | 'per day' | 'fixed project' | 'contact for quote';
export type AvailabilityStatus = 'Available' | 'Busy' | 'Away';
export type UserRole = 'user' | 'admin';
export type ProductCondition =
    | 'New'
    | 'Refurbished'
    | 'Home-used'
    | 'Used - Like New'
    | 'Used - Good'
    | 'Used - Fair';

export interface Application {
    _id: string;
    job: string;
    applicant: string;
    resume: string;
    coverLetter?: string;
    status: ApplicationStatus;
    notesByEmployer?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Comment {
    _id: string;
    user: string | User;
    product: string;
    content: string;
    likes: string[];
    parentId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Conversation {
    _id: string;
    participants: string[];
    lastMessage?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ISalary {
    min?: number;
    max?: number;
    currency: string;
}

export interface Job {
    _id: string;
    employer: string;
    companyName: string;
    companyLogo?: string;
    jobImage: string;
    title: string;
    description: string;
    category: string;
    jobType: string;
    workMode: WorkMode;
    salary: ISalary;
    phoneNumber?: string;
    emailForApplications?: string;
    region: string;
    district: string;
    requirements: string[];
    benefits: string[];
    applications: string[];
    applicationDeadline?: string; // Dates are transmitted as ISO strings over JSON
    isOpen: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface WorkExperience {
    _id?: string;
    companyName: string;
    jobTitle: string;
    location?: string;
    startDate: string;
    endDate?: string;
    isCurrentJob: boolean;
    description?: string;
}
export interface Education {
    _id?: string;
    schoolName: string;
    degree: string;
    fieldOfStudy?: string;
    startDate: string;
    endDate?: string;
}
export interface ExpectedSalary {
    min?: number;
    currency: string;
}
export interface JobSeekerProfile {
    _id: string;
    user: string | User;
    profilePicture?: string;
    professionalHeadline: string;
    bio?: string;
    skills: string[];
    experience: WorkExperience[];
    education: Education[];
    resumeUrl?: string;
    preferredJobTypes: string[];
    expectedSalary: ExpectedSalary;
    isSearchingForJob: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Message {
    _id: string;
    conversationId: string;
    senderId: string;
    content?: string;
    attachment?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Notification {
    _id: string;
    recipientId: string;
    senderId: string | User;
    type: NotificationType;
    itemDetails: string;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface DeliveryTimeline {
    from?: string;
    to?: string;
}

export interface Product {
    _id: string;
    seller: string | User;
    name: string;
    description: string;
    price: number;
    phoneNumber: string;
    category: string;
    productType: string;
    region: string;
    district: string;
    images: string[];
    delivery?: DeliveryTimeline;
    warranty?: string;
    brand?: string;
    color?: string;
    condition?: ProductCondition;
    comments: Comment[];
    isAvailable: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Report {
    _id: string;
    reporterId: string;
    targetType: ReportTargetType;
    targetId: string; // Can be a string ID, or dynamically populated based on targetType
    reason: ReportReason;
    description?: string;
    status: ReportStatus;
    createdAt: string;
    updatedAt: string;
}

export interface Review {
    _id: string;
    reviewer: string;
    provider: string;
    rating: ReviewRating;
    comment?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ServiceProviderPricing {
    rate: number;
    basis: PricingBasis;
    currency: string;
}
export interface ServiceProvider {
    _id: string;
    user: string | User;
    businessName: string;
    serviceType: string;
    description: string;
    pricing: ServiceProviderPricing;
    phoneNumber: string;
    whatsappNumber?: string;
    region: string;
    district: string;
    portfolioImages: string[];
    availabilityStatus: AvailabilityStatus;
    averageRating: number;
    totalReviews: number;
    isVerifiedProvider: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface User {
 _id: string;
  firstName: string;
  lastName: string;
  email: string;
  clerkId?: string;
  password?: string; 
  verified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: string;
  otp?: string;
  otp_expiry_time?: string;     
  profilePicture: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}