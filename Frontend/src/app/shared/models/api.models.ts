export interface AdminLoginResponse {
  message: string;
  token: string;
  admin: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface QrItem {
  _id: string;
  qrId: string;
  qrImageDataUrl: string;
  activationLink: string;
  emergencyLink: string;
  status: string;
  previousStatus?: string;
  blockedReason?: string;
  createdAt: string;
  updatedAt: string;

  customerName?: string;
  mobileNumber?: string;
  email?: string;
  bloodGroup?: string;
  disease?: string;
  address?: string;
  vehicleName?: string;
  chassisNumber?: string;
  motorNumber?: string;
  showroomName?: string;
}

export interface QrStatusResponse {
  emergencyStatus: string;
  warrantyStatus: string;
  data: QrStatusResponse;
  qrId: string;
  status: string;
  redirectPath: string;
}

export interface OtpSendResponse {
  message: string;
  qrId: string;
  mobile: string;
  testOtp?: string;
}

export interface CustomerRegistrationResponse {
  message: string;
  customer: any;
}

export interface EmergencyResponse {
  qrId: string;
  owner: {
    customerName: string;
    mobileNumber: string;
    email: string;
    bloodGroup: string;
    disease: string;
    address: string;
    vehicleName: string;
    chassisNumber: string;
    motorNumber: string;
    showroomName: string;
  };
  emergencyContacts: Array<{
    name: string;
    mobile: string;
    email: string;
    relation: string;
  }>;
  actions: {
    police: string;
    ambulance: string;
  };
}

export interface DashboardResponse {
  totalQrs: number;
  activeQrs: number;
  inactiveQrs: number;
  blockedQrs: number;
  totalCustomers: number;
  totalScans: number;
  totalAlerts: number;
  recentScans: any[];
}