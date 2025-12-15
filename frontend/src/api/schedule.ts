import request from '../app/request';

export interface Schedule {
  id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  location?: string;
  type: 'event' | 'meeting' | 'reminder' | 'task';
  color: string;
  creator_id: number;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleParams {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  location?: string;
  type?: string;
  color?: string;
}

export const getSchedules = (startDate?: string, endDate?: string) => {
  return request.get<any, Schedule[]>('/api/schedule', {
    params: { startDate, endDate }
  });
};

export const createSchedule = (data: CreateScheduleParams) => {
  return request.post<any, { id: number; message: string }>('/api/schedule', data);
};

export const updateSchedule = (id: number, data: Partial<CreateScheduleParams>) => {
  return request.put<any, { message: string }>(`/api/schedule/${id}`, data);
};

export const deleteSchedule = (id: number) => {
  return request.delete<any, { message: string }>(`/api/schedule/${id}`);
};
