export type UserRole = 'client' | 'contractor' | 'organizer' | 'venue_manager' | 'administrator';

export type UserPermission =
  | 'contracts.view_all'
  | 'contracts.manage_templates'
  | 'contracts.cancel_any'
  | 'contracts.edit_created_draft'
  | 'disputes.view_all'
  | 'disputes.manage'
  | 'disputes.approve_financial'
  | 'security.view'
  | 'security.manage'
  | 'users.manage_access'
  | 'audit.view'
  | 'system.admin';

export type PlatformStaffRole =
  | 'owner'
  | 'senior_operator'
  | 'reclamation_manager'
  | 'security_manager'
  | 'read_only_auditor';

export interface StaffAccessProfile {
  id: string;
  displayName: string;
  role: PlatformStaffRole;
  permissions: UserPermission[];
  status: 'active' | 'suspended';
  twoFactorEnabled: boolean;
  lastActiveAt: string;
}

export interface CanonicalUser {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  primaryEmail: string;
  primaryPhone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  status: 'active' | 'suspended';
  roles: UserRole[];
  permissions?: UserPermission[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface AuthIdentity {
  id: string;
  userId: string;
  provider: 'email' | 'phone' | 'telegram' | 'max' | 'esia';
  providerSubject: string;
  providerUsername?: string;
  providerEmail?: string;
  providerPhone?: string;
  providerClaims?: any;
  verifiedAt: string;
  linkedAt: string;
  lastUsedAt: string;
  status: 'active' | 'inactive';
}

export interface VerifiedContact {
  type: 'email' | 'phone';
  value: string;
  verifiedAt: string;
}

export interface UserSession {
  user: CanonicalUser;
  identities: {
    provider: 'email' | 'phone' | 'telegram' | 'max' | 'esia';
    providerSubject: string;
    providerUsername?: string;
    linkedAt: string;
    verifiedAt: string;
  }[];
}

export interface AccountLinkRequest {
  provider: 'email' | 'phone' | 'telegram' | 'max' | 'esia';
  providerSubject: string;
  userDetails?: any;
}

export interface AccountMergeRequest {
  conflictUserId: string;
}

export interface AuthAuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  ip?: string;
  userAgent?: string;
  details?: string;
}

// Contractor & Categories
export type ContractorCategory =
  | 'venue' | 'venues'
  | 'organizer' | 'organizers'
  | 'coordinator' | 'coordinators'
  | 'host' | 'hosts'
  | 'dj' | 'djs'
  | 'photographer' | 'photographers'
  | 'videographer' | 'videographers'
  | 'decorator' | 'decorators'
  | 'florist' | 'florists'
  | 'catering'
  | 'equipment'
  | 'technical_production'
  | 'artist' | 'artists'
  | 'transport'
  | 'accommodation'
  | 'security'
  | 'children_entertainment'
  | 'other';

export interface ContractorService {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string; // e.g. 'час', 'день', 'услуга'
}

export interface ContractorVerification {
  status: 'unverified' | 'pending' | 'verified' | 'update_required' | 'rejected' | 'blocked';
  legalStatus: 'individual' | 'self_employed' | 'sole_proprietor' | 'company'; // физлицо, самозанятый, ИП, ООО
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface ResponseMetrics {
  receivedAt?: string;
  firstViewedAt?: string;
  firstResponseAt?: string;
  firstResponseSeconds?: number;
  averageResponseSeconds?: number;
  responseRatePercent: number;
  unansweredCount: number;
  overdueCount: number;
  currentSlaStatus: 'normal' | 'expiring' | 'overdue' | 'replied';
}

export interface ContractorReputation {
  rating: number;
  reviewsCount: number;
  completedOrdersCount: number;
  cancellationsCount: number;
  disputesCount: number;
}

export interface ContractorDocuments {
  id: string;
  title: string;
  type: string;
  fileUrl: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ContractorTeamMember {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

export interface ContractorProfile {
  id: string;
  userId?: string;
  category: ContractorCategory;
  displayName?: string;
  legalStatus?: 'individual' | 'self_employed' | 'sole_proprietor' | 'company';
  city: string;
  serviceRegions?: string[];
  description: string;
  startingPrice?: number;
  priceUnit?: string;
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'update_required' | 'rejected' | 'blocked';
  profileCompleteness?: number; // percent 0-100
  responseMetrics?: ResponseMetrics;
  reputation?: ContractorReputation;
  services?: ContractorService[];
  portfolio?: string[]; // image URLs
  documents?: ContractorDocuments[];
  calendarResourceIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  isFounderChoice?: boolean;
  demo?: boolean;
  // Legacy fields
  name?: string;
  image?: string;
  rating?: number;
  reviewsCount?: number;
  isAvailable?: boolean;
  price?: number;
  experience?: string | number;
  serviceIncludes?: string[];
  musicGenres?: string[];
  equipment?: any;
  freeDates?: string[];
  paymentTerms?: string;
  extraCosts?: string;
}

export type Contractor = ContractorProfile;

// Dynamic Scoring Models
export interface ScoringRule {
  id: string;
  metric: string;
  label: string;
  weight: number;
  minVal?: number;
  maxVal?: number;
  penalty?: boolean;
}

export interface ScoringRuleVersion {
  id: string;
  version: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  publishedAt?: string;
  author: string;
  changeReason: string;
  rules: ScoringRule[];
}

export interface ScoringMetric {
  id: string;
  name: string;
  value: number;
}

export interface ContractorScoreBreakdown {
  verificationScore: number;
  profileCompletenessScore: number;
  availabilityAccuracyScore: number;
  responseSpeedScore: number;
  responseRateScore: number;
  completionRateScore: number;
  cancellationScore: number; // penalty
  disputeScore: number; // penalty
  reviewScore: number;
  documentScore: number;
  finalScore: number;
  calculatedAt: string;
  scoringVersionId: string;
}

export interface ContractorScore {
  contractorId: string;
  finalScore: number;
  breakdown: ContractorScoreBreakdown;
  rankingWeight: number;
}

export interface ScoreHistoryEntry {
  id: string;
  contractorId: string;
  oldScore: number;
  newScore: number;
  reason: string;
  timestamp: string;
}

export interface ScoreRecalculationLog {
  id: string;
  timestamp: string;
  recalculatedCount: number;
  versionId: string;
}

// Ranking Engine types
export interface RankingScore {
  contractorId: string;
  organicScore: number;
  recommendationScore: number;
  sponsoredBoost: number; // платное продвижение
  finalScore: number;
  labelType: 'organic' | 'recommendation' | 'founder_choice' | 'sponsored' | 'boosted';
}

// Reviews
export interface ReviewDimension {
  name: 'quality' | 'accuracy' | 'communication' | 'punctuality' | 'pricing' | 'general';
  rating: number;
}

export interface Review {
  id: string;
  bookingId: string;
  contractorId: string;
  clientId: string;
  clientName: string;
  rating: number; // Average
  comment: string;
  dimensions: ReviewDimension[];
  createdAt: string;
  isDemo?: boolean;
  response?: {
    text: string;
    createdAt: string;
  };
}

// Unified Booking
export type ClientStatus = 'confirmed' | 'pending';
export type ContractorStatus = 'pending' | 'confirmed' | 'rejected';

export interface Booking {
  id: string;
  clientId?: string;
  eventId?: string;
  contractorId: string;
  contractorName: string;
  contractorImage: string;
  date: string;
  startTime: string;
  duration: number; // in hours
  address: string;
  eventType: string;
  selectedService: string;
  price: number;
  prepayment: number;
  extraCosts: number;
  comment: string;
  clientStatus: ClientStatus;
  contractorStatus: ContractorStatus;
  createdAt: string;
}

// Tasks & Message
export interface Task {
  id: string;
  title: string;
  dueDate: string;
  isCompleted: boolean;
  category: string;
}

export interface Message {
  id: string;
  sender: 'client' | 'contractor' | 'system' | 'organizer';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  isPaid: boolean;
}

export type EventServiceCategory =
  | 'venue'
  | 'organizer'
  | 'coordinator'
  | 'host'
  | 'dj'
  | 'photographer'
  | 'videographer'
  | 'catering'
  | 'menu'
  | 'decorator'
  | 'florist'
  | 'equipment'
  | 'artists'
  | 'transport'
  | 'accommodation'
  | 'invitations'
  | 'guests'
  | 'seating'
  | 'drinks'
  | 'timeline'
  | 'documents';

export type EventPlanStatus =
  | 'not_started'
  | 'in_progress'
  | 'options_selected'
  | 'request_sent'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'booked'
  | 'completed'
  | 'skipped';

export interface EventPlanItem {
  id: string;
  category: EventServiceCategory;
  title: string;
  description: string;
  /** @deprecated Состав мероприятия определяет клиент, обязательных этапов нет. */
  required: boolean;
  order: number;
  status: EventPlanStatus;
  route: string;
  bookingId?: string;
  completedAt?: string;
  skippedAt?: string;
}

export interface ContractorRequest {
  id: string;
  contractorId: string;
  contractorName: string;
  status: 'pending' | 'accepted' | 'rejected';
  sentAt: string;
}

export interface SavedDrinkListItem {
  id: string;
  name: string;
  category: 'strong' | 'wine' | 'soft' | 'hot' | 'beer';
  bottles: number;
  liters: number;
}

export interface DrinksCalculation {
  totalPrice: number;
  corkFeeTotal: number;
  totalWithCork: number;
  savedDrinksList: SavedDrinkListItem[];
}

export enum NadoEventSegment {
  START = 'start',
  CLASSIC = 'classic',
  PREMIUM = 'premium',
  CUSTOM = 'custom'
}

export interface CustomGuest {
  id: string;
  name: string;
  status: 'invited' | 'confirmed' | 'declined';
  ageGroup: 'adult' | 'child';
  diet: string;
}

export interface EventProject {
  id: string;
  name: string;
  ownerUserId?: string;
  clientId?: string;
  organizerId?: string;
  eventType: string;
  city: string;
  address: string;
  date: string;
  time: string;
  dateUnknown: boolean;
  guestsCount: number;
  budgetRange: string;
  budgetTotal: number;
  budgetPaid: number;
  style: string;
  alreadyHave: string[];
  neededServices: string[];
  planItems: EventPlanItem[];
  tasks: Task[];
  budgetItems: BudgetCategory[];
  team: string[]; // List of Contractor IDs
  contractorRequests: ContractorRequest[]; // List of requests sent
  bookings: Booking[];
  drinksCalculation?: DrinksCalculation;
  messages: Message[];
  guestsList?: CustomGuest[];
  createdAt: string;
  updatedAt: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  progressPercent: number;
  selectedPackage?: 'budget_save' | 'balance' | 'accent' | null;
  nadoSegment?: NadoEventSegment;
  budgetFlexibility?: 'strict' | 'plus10' | 'different' | 'unknown' | 'balanced';
  selectedPriorityIds?: string[];
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  isFilled: boolean;
}

export interface ProjectState {
  name: string;
  date: string;
  budgetTotal: number;
  budgetPaid: number;
  tasks: Task[];
  messages: Message[];
}

// -------------------------------------------------------------
// CRM SYSTEMS
// -------------------------------------------------------------
export interface CRMLead {
  id: string;
  eventType: string;
  eventDate: string;
  city: string;
  guestsCount: number;
  budget: number;
  requestedCategory: string;
  clientName: string;
  maskedContact: string; // "Ив** +7(999)***-**-**"
  source: string; // e.g. "Каталог NADO", "Форма сайта", "Прямая ссылка"
  readiness: 'high' | 'medium' | 'low';
  urgency: 'hot' | 'warm' | 'cold';
  requirements: string;
  createdAt: string;
  firstViewedAt?: string;
  firstResponseAt?: string;
  nextActionAt?: string;
  assignedUserId?: string;
  pipelineStage:
    | 'new'
    | 'unviewed'
    | 'viewed'
    | 'needs_reply'
    | 'contacted'
    | 'proposal_preparing'
    | 'proposal_sent'
    | 'negotiation'
    | 'waiting_client'
    | 'terms_agreed'
    | 'confirmed'
    | 'lost'
    | 'archived';
  probability: number; // 0-100
  lostReason?: string;
  tags: string[];
}

export interface CRMClient {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email: string;
  contactChannel: string;
  projectsCount: number;
  totalSpent: number;
  activeDisputesCount: number;
  createdAt: string;
  notes: string;
  tags: string[];
}

export interface CRMContact {
  id: string;
  clientId: string;
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface CRMCompany {
  id: string;
  name: string;
  inn?: string;
  address?: string;
}

export interface CRMDeal {
  id: string;
  clientId: string;
  title: string;
  value: number;
  stage: string;
  createdAt: string;
  closedAt?: string;
}

export interface CRMPipelineStage {
  id: string;
  name: string;
  color: string;
}

export interface CRMPipeline {
  id: string;
  name: string;
  stages: CRMPipelineStage[];
}

export interface CRMActivity {
  id: string;
  leadId?: string;
  clientId?: string;
  type: 'call' | 'email' | 'meeting' | 'proposal' | 'note';
  title: string;
  description: string;
  createdAt: string;
  doneAt?: string;
}

export interface CRMTask {
  id: string;
  leadId?: string;
  clientId?: string;
  title: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
  assignedTo: string;
}

export interface CRMNote {
  id: string;
  leadId?: string;
  clientId?: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface CRMMessage {
  id: string;
  leadId?: string;
  clientId?: string;
  text: string;
  sender: 'client' | 'contractor' | 'system';
  timestamp: string;
}

// -------------------------------------------------------------
// NADO CALENDAR
// -------------------------------------------------------------
export interface CalendarResource {
  id: string;
  ownerId: string; // Contractor profile ID
  name: string; // e.g., "Главный зал", "Сам диджей"
  type: 'staff' | 'space' | 'equipment' | 'other';
  capacity?: number; // для залов
}

export interface AvailabilitySlot {
  id: string;
  ownerId: string;
  resourceId: string; // Ссылка на CalendarResource
  startAt: string; // ISO Date YYYY-MM-DD
  endAt: string; // ISO Date YYYY-MM-DD
  status: 'available' | 'tentative' | 'hold' | 'booked' | 'blocked' | 'unavailable';
  source: 'direct' | 'ical' | 'api' | 'system';
  eventId?: string;
  orderId?: string;
  holdExpiresAt?: string; // для удержания дат
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarBooking {
  id: string;
  resourceId: string;
  title: string;
  date: string;
  status: 'tentative' | 'confirmed';
}

export interface CalendarHold {
  id: string;
  resourceId: string;
  date: string;
  expiresAt: string;
}

export interface CalendarConflict {
  id: string;
  resourceId: string;
  date: string;
  conflictingIds: string[];
  message: string;
}

export interface WorkingHours {
  dayOfWeek: number; // 1-7
  openTime: string;
  closeTime: string;
}

export interface BlockedPeriod {
  id: string;
  resourceId: string;
  startAt: string;
  endAt: string;
  reason: string;
}

// -------------------------------------------------------------
// NADO CONTRACTS & DOCUMENTS
// -------------------------------------------------------------
export type LegalDocumentStatus = 'draft' | 'legal_review' | 'approved' | 'published' | 'archived';

export interface LegalDocumentVersion {
  id: string;
  documentId: string;
  version: string;
  title: string;
  content: string;
  summary: string;
  publishedAt: string;
  effectiveAt: string;
  archivedAt?: string;
  status: LegalDocumentStatus;
  author: string;
  changeReason: string;
}

export interface LegalDocument {
  id: string;
  key: string;
  title: string;
  currentVersionId: string;
  status: LegalDocumentStatus;
  versions: LegalDocumentVersion[];
}

export interface ConsentRecord {
  id: string;
  userId: string;
  documentId: string;
  documentVersionId: string;
  acceptedAt: string;
  acceptanceMethod: 'checkbox_click' | 'profile_save' | 'implicit';
  revokedAt?: string;
  technicalMetadata: string;
}

export interface DocumentAcceptance {
  documentId: string;
  versionId: string;
  acceptedAt: string;
}

export type ContractDocumentKind = 
  | 'platform_policy' 
  | 'consent' 
  | 'service_contract' 
  | 'venue_contract' 
  | 'attachment' 
  | 'additional_agreement' 
  | 'act' 
  | 'notice';

export type DocumentKind = ContractDocumentKind;

export type ContractStatus = 'draft' | 'data_required' | 'ready_for_review' | 'sent' | 'partially_confirmed' | 'confirmed' | 'revision_required' | 'superseded' | 'cancelled' | 'completed';

export interface VisibilityCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'is_true' | 'is_false' | 'exists';
  value?: string | boolean;
}

export interface ContractClause {
  id: string;
  sectionKey: string;
  title: string;
  order: number;
  body: string;
  required: boolean;
  visibilityCondition?: VisibilityCondition;
  legalReviewNote?: string;
}

export interface ContractVariable {
  key: string;
  label: string;
  description: string;
  type: 'text' | 'textarea' | 'number' | 'money' | 'percentage' | 'date' | 'time' | 'datetime' | 'address' | 'list' | 'boolean' | 'select' | 'multiselect' | 'person' | 'organization' | 'document_reference';
  required: boolean;
  source: 'client' | 'contractor' | 'venue' | 'event' | 'service' | 'platform' | 'manual';
  defaultValue?: string;
  validation?: string;
  visibilityCondition?: VisibilityCondition;
  group?: string;
  options?: string[];
}

export type ContractCategory = 'platform' | 'contractor' | 'venue' | 'organizer';

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: 'platform' | 'contractor' | 'venue' | 'organizer';
  subcategory?: 'rent' | 'services' | 'mixed'; // для площадок
  documentKind?: ContractDocumentKind;
  partyRoles: string[];
  status: 'draft' | 'legal_review' | 'revision_required' | 'approved' | 'scheduled' | 'published' | 'archived';
  currentVersionId: string;
  applicableLegalStatuses?: string[];
  supportedAttachments?: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerRole?: string;
  reviewComment?: string;
  approvedVersionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractTemplateVersion {
  id: string;
  templateId: string;
  version: string;
  title: string;
  introduction?: string;
  clauses: ContractClause[];
  variables: ContractVariable[];
  attachments?: string[];
  status: 'draft' | 'legal_review' | 'revision_required' | 'approved' | 'scheduled' | 'published' | 'archived';
  createdAt: string;
  publishedAt?: string;
  effectiveAt?: string;
  archivedAt?: string;
  author: string;
  changeReason?: string;
  content?: string; // Backwards compatibility content
  reviewedBy?: string;
  reviewerRole?: string;
  reviewedAt?: string;
  reviewComment?: string;
  approvedVersionId?: string;
  scheduledAt?: string;
}

export interface GeneratedContractVersion {
  id: string;
  contractId: string;
  version: number;
  templateVersionId?: string;
  immutable?: boolean;
  variableValues: Record<string, string>;
  fullText: string;
  createdAt: string;
  createdBy: string;
  changeReason: string;
}

export interface ContractAttachment {
  id: string;
  contractId: string;
  name: string; // e.g. "Техническое задание", "Смета", "Меню"
  type: string;
  content: string;
  createdAt: string;
}

export interface ExternalContractParty {
  id: string;
  name: string;
  role: 'client' | 'contractor' | 'venue' | 'organizer';
  displayName?: string;
  legalStatus?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  legalAddress?: string;
  bankDetails?: string;
  requisites?: string;
  contactPerson?: string;
  createdAt?: string;
  isExternal: true;
}

export interface ContractPartyOption {
  id: string;
  name: string;
  partyId: string;
  userId?: string;
  entityId?: string;
  role: 'client' | 'contractor' | 'venue' | 'organizer';
  displayName: string;
  isExternal: boolean;
  legalStatus?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  bankDetails?: string;
  contactPerson?: string;
  requisites?: string;
}

export interface ContractConfirmation {
  id: string;
  contractId: string;
  contractVersionId: string;
  contractVersionNumber: number;
  partyId: string; // userId or contractorId
  role: 'client' | 'contractor' | 'platform' | 'venue' | 'organizer';
  confirmedAt: string;
  ipAddress?: string;
  note?: string;
  method?: string;
  isDemo?: boolean;
}

export interface ContractAuditEntry {
  id: string;
  contractId: string;
  actorId: string;
  actorRole: string;
  action: string;
  timestamp: string;
  details: string;
}

export interface GeneratedContract {
  id: string;
  templateId: string;
  templateName: string;
  templateVersionId?: string;
  category?: ContractCategory;
  templateSubcategory?: string;
  serviceCategory?: string;
  partyRoles?: string[];
  documentKind?: ContractDocumentKind;
  eventId?: string;
  orderId?: string; // bookingId
  proposalId?: string;
  clientId?: string;
  clientName?: string;
  contractorId?: string;
  contractorName?: string;
  venueId?: string;
  venueName?: string;
  organizerId?: string;
  organizerName?: string;
  contractorProfileId?: string;
  venueProfileId?: string;
  organizerProfileId?: string;
  createdByUserId?: string;
  currentVersionId?: string;
  status: ContractStatus;
  currentVersion: number;
  variableValues: Record<string, string>;
  workingDraft?: Record<string, string>;
  fullText: string;
  attachments: ContractAttachment[];
  confirmations: ContractConfirmation[];
  auditLog: ContractAuditEntry[];
  demo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderTermsSnapshot {
  id: string;
  orderId: string; // matches bookingId
  version: number;
  clientId: string;
  contractorId: string;
  contractorName: string;
  serviceCategory: string;
  serviceDescription: string;
  eventId: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  serviceComposition: string[];
  basePrice: number;
  namedAdditionalServices: { name: string; price: number }[];
  platformServiceFee: number;
  protectedPaymentFee: number;
  discount: number;
  finalPrice: number;
  prepayment: number;
  paymentSchedule: string; // e.g. "50/50"
  cancellationPolicy: string;
  refundPolicy: string;
  responsibilities: string;
  additionalTerms?: string;
  createdAt: string;
  clientConfirmedAt?: string;
  contractorConfirmedAt?: string;
  status: 'draft' | 'sent' | 'partially_confirmed' | 'confirmed' | 'superseded' | 'cancelled';
}

// Commercial Proposals
export interface ProposalItem {
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

export interface ProposalVersion {
  version: number;
  items: ProposalItem[];
  totalPrice: number;
  prepaymentPercent: number;
  comment?: string;
  validUntil: string;
  createdAt: string;
}

export interface CommercialProposal {
  id: string;
  leadId: string;
  clientId: string;
  clientName: string;
  contractorId: string;
  contractorName: string;
  serviceCategory: string;
  status: 'draft' | 'sent' | 'viewed' | 'negotiation' | 'accepted' | 'rejected' | 'expired' | 'superseded';
  currentVersion: number;
  versions: ProposalVersion[];
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// FINANCES & TARIFFS
// -------------------------------------------------------------
export interface Tariff {
  id: string;
  name: string; // 'FREE' | 'PRO' | 'BUSINESS' | 'EVENT_MANAGER_PRO' | 'AI_ORGANIZER_PRO'
  price: number; // руб в месяц
  commissionPercent: number; // % комиссии за сделку
  features: string[];
  status: 'active' | 'inactive';
}

export interface TariffVersion {
  id: string;
  version: string;
  createdAt: string;
  publishedAt: string;
  effectiveAt: string;
  expiresAt?: string;
  status: 'draft' | 'published' | 'archived';
  author: string;
  reason: string;
  tariffs: Tariff[];
}

export interface TariffAssignment {
  id: string;
  userId: string;
  tariffId: string;
  tariffName: string;
  activatedAt: string;
  expiresAt?: string;
  status: 'active' | 'expired';
}

// Disputes
export interface DisputeCase {
  id: string;
  orderId: string;
  bookingId: string;
  type: 
    | 'cancellation' 
    | 'reschedule' 
    | 'refund' 
    | 'contractor_no_show' 
    | 'client_no_show' 
    | 'partial_service' 
    | 'quality_dispute' 
    | 'scope_dispute' 
    | 'payment_dispute' 
    | 'contractor_complaint' 
    | 'client_complaint';
  reason: string;
  description: string;
  desiredResolution: string;
  files: string[];
  status: 'draft' | 'sent' | 'under_review' | 'info_needed' | 'awaiting_financial_approval' | 'resolved' | 'closed';
  priority?: 'standard' | 'high' | 'critical';
  riskType?: 'service' | 'financial' | 'safety' | 'fraud';
  orderAmount?: number;
  assignedManagerId?: string;
  assignedManagerName?: string;
  slaDeadlineAt?: string;
  firstResponseAt?: string;
  factCheck?: DisputeFactCheck;
  resolutionProposal?: DisputeResolutionProposal;
  internalNotes?: DisputeInternalNote[];
  actionHistory?: DisputeActionEntry[];
  operationsBlockRequest?: OperationsBlockRequest;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeFactCheck {
  orderTermsChecked: boolean;
  evidenceReviewed: boolean;
  partiesContacted: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface DisputeResolutionProposal {
  outcome: 'no_action' | 'partial_compensation' | 'full_compensation' | 'service_reperformance' | 'other';
  note: string;
  compensationAmount: number;
  proposedBy: string;
  proposedAt: string;
  financialApprovalStatus: 'not_required' | 'pending' | 'approved' | 'rejected';
  financialApprovedBy?: string;
  financialApprovedAt?: string;
}

export interface DisputeInternalNote {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface DisputeActionEntry {
  id: string;
  actorId: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface OperationsBlockRequest {
  requestedAt: string;
  requestedBy: string;
  status: 'requested' | 'approved' | 'rejected';
  targetUserId?: string;
  reason: string;
}

export interface DisputeEvidence {
  id: string;
  disputeId: string;
  type: 'photo' | 'document' | 'text';
  url?: string;
  comment: string;
  createdAt: string;
}

export interface RefundRequest {
  id: string;
  bookingId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface RefundDecision {
  refundRequestId: string;
  approvedAmount: number;
  decisionNotes: string;
  decidedAt: string;
}

export interface PaymentProvider {
  id: string;
  name: string;
  enabled: boolean;
  supportsReservation: boolean;
  supportsSplitPayments: boolean;
  supportsRefunds: boolean;
  supportsPartialRefunds: boolean;
  supportsPayouts: boolean;
  supportsReceipts: boolean;
}

export interface LedgerEntryStatusHistoryItem {
  status: 'pending' | 'cleared' | 'failed';
  timestamp: string;
}

export interface LedgerEntry {
  id: string;
  projectId: string;
  bookingId: string;
  amount: number;
  type: 'prepayment' | 'final_payment' | 'service_fee';
  status: 'pending' | 'cleared' | 'failed';
  externalPaymentId?: string;
  paymentProviderId?: string;
  payerId?: string;
  recipientId?: string;
  currency: string;
  tariffVersionId?: string;
  feeAmount: number;
  createdAt: string;
  updatedAt: string;
  statusHistory: LedgerEntryStatusHistoryItem[];
}

export interface CommissionRule {
  category: string;
  percent: number;
  fixedFee: number;
}

export interface LeadPriceRule {
  category: string;
  basePrice: number;
}

export interface SubscriptionPlanVersion {
  id: string;
  name: string;
  price: number;
  features: string[];
}

export interface PromotionProduct {
  id: string;
  name: string;
  price: number;
}

export interface AdvertisingCampaign {
  id: string;
  name: string;
  budget: number;
}

export interface MonetizationChangeLog {
  id: string;
  changeType: string;
  description: string;
  timestamp: string;
}

export interface NotificationReceipt {
  id: string;
  type: 'legal_update' | 'order_update' | 'dispute_update' | 'payment_update';
  userId: string;
  documentId?: string;
  documentVersionId?: string;
  title: string;
  sentAt: string;
  openedAt?: string;
  requiresAction: boolean;
  actionCompletedAt?: string;
}

export interface DrinkInput {
  guestsCount: number;
  menCount: number;
  womenCount: number;
  childrenCount: number;
  nonDrinkersCount: number;
  durationHours: number;
  season: 'summer' | 'winter' | 'autumn_spring';
  activityLevel: 'high' | 'medium' | 'low';
}

export interface DrinkConfig {
  id: string;
  name: string;
  category: 'strong' | 'wine' | 'soft' | 'hot' | 'beer';
  unit: string;
  approxPrice: number;
  enabled: boolean;
}

// -------------------------------------------------------------
// AUDIT ENGINE
// -------------------------------------------------------------
export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: 'lead' | 'booking' | 'contract' | 'scoring' | 'tariff' | 'dispute' | 'calendar' | 'user';
  entityId: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// STAGE 6 ADDITIONAL TYPES
// -------------------------------------------------------------
export interface VenueSpace {
  id: string;
  venueId: string;
  name: string;
  capacitySeated: number;
  capacityBuffet: number;
  areaSqM: number;
  pricePerDay: number;
  pricePerHour?: number;
  corkFeePerPerson?: number;
  hasTerrace: boolean;
  hasParking: boolean;
  description: string;
  images: string[];
}

export interface VenuePackage {
  id: string;
  venueId: string;
  name: string;
  pricePerPerson: number;
  minGuests: number;
  menuDescription: string;
  includedServices: string[];
  corkFeeIncluded: boolean;
}

export interface ContractorAnalytics {
  contractorId: string;
  period: string;
  viewsCount: number;
  leadsCount: number;
  conversionRate: number;
  avgSlaResponseMinutes: number;
  revenueTotal: number;
  completedBookings: number;
}

export interface VenueAnalytics {
  venueId: string;
  period: string;
  occupancyPercent: number;
  avgCheckPerGuest: number;
  totalBookings: number;
  disputesCount: number;
}

export interface PlatformAnalytics {
  period: string;
  activeUsers: number;
  totalGmv: number;
  platformCommissionRevenue: number;
  activeContractorsCount: number;
  disputeResolutionAvgHours: number;
}

export interface AuthProviderPayload {
  provider: 'email' | 'phone' | 'telegram' | 'max' | 'esia';
  subject: string;
  email?: string;
  phone?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  verified: boolean;
}

export interface TelegramAuthPayload {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface MaxAuthPayload {
  maxUserId: string;
  email?: string;
  phone?: string;
  verifiedAt: string;
}

export interface EsiaAuthPayload {
  oid: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  trustedLevel: string;
  idDocNumber?: string;
}

export interface ContractVariableValue {
  key: string;
  value: string;
  updatedAt?: string;
}

export interface DrinksResultItem {
  name: string;
  category: 'strong' | 'wine' | 'soft' | 'hot' | 'beer';
  bottles: number;
  liters: number;
  estimatedPrice: number;
}

export type GuestStatus = 'invited' | 'confirmed' | 'declined';
export type GuestAgeGroup = 'adult' | 'child' | 'teen';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
