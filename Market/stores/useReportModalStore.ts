import { create } from 'zustand';
import { ReportTargetType } from '../types';

interface ReportModalState {
  isOpen: boolean;
  targetType: ReportTargetType | null;
  targetId: string | null;
  openReportModal: (targetType: ReportTargetType, targetId: string) => void;
  closeReportModal: () => void;
}

export const useReportModalStore = create<ReportModalState>((set) => ({
  isOpen: false,
  targetType: null,
  targetId: null,
  openReportModal: (targetType, targetId) => set({ isOpen: true, targetType, targetId }),
  closeReportModal: () => set({ isOpen: false, targetType: null, targetId: null }),
}));
