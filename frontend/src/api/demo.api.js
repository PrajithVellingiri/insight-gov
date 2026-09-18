export const DEMO_DEPARTMENTS = [
  { id: 'demo-dept-1', name: 'Infrastructure & Roads' },
  { id: 'demo-dept-2', name: 'Water & Sanitation' },
  { id: 'demo-dept-3', name: 'Public Health & Safety' },
];

export const DEMO_OFFICERS = [
  { id: 'demo-off-1', name: 'Sarah Jenkins', email: 's.jenkins@insight.gov', department_id: 'demo-dept-1' },
  { id: 'demo-off-2', name: 'Marcus Thorne', email: 'm.thorne@insight.gov', department_id: 'demo-dept-2' },
  { id: 'demo-off-3', name: 'Elena Rodriguez', email: 'e.rodriguez@insight.gov', department_id: 'demo-dept-3' },
  { id: 'demo-off-4', name: 'David Chen', email: 'd.chen@insight.gov', department_id: 'demo-dept-1' },
  { id: 'demo-off-5', name: 'Aisha Patel', email: 'a.patel@insight.gov', department_id: 'demo-dept-2' },
];

export const DEMO_ANALYTICS = {
  'demo-off-1': {
    officer_name: 'Sarah Jenkins',
    department_name: 'Infrastructure & Roads',
    total_assigned: 150,
    active_workload: 12,
    resolved: 125,
    pending: 8,
    in_progress: 4,
    rejected: 8,
    duplicate: 3,
    withdrawn: 2,
    resolution_rate: 90.5,
    priority_breakdown: { critical: 10, high: 30, medium: 70, low: 15 },
    average_resolution_days: 3.2
  },
  'demo-off-2': {
    officer_name: 'Marcus Thorne',
    department_name: 'Water & Sanitation',
    total_assigned: 320,
    active_workload: 65,
    resolved: 210,
    pending: 40,
    in_progress: 25,
    rejected: 25,
    duplicate: 15,
    withdrawn: 5,
    resolution_rate: 82.3,
    priority_breakdown: { critical: 45, high: 85, medium: 120, low: 70 },
    average_resolution_days: 5.8
  },
  'demo-off-3': {
    officer_name: 'Elena Rodriguez',
    department_name: 'Public Health & Safety',
    total_assigned: 95,
    active_workload: 5,
    resolved: 85,
    pending: 3,
    in_progress: 2,
    rejected: 3,
    duplicate: 1,
    withdrawn: 1,
    resolution_rate: 94.4,
    priority_breakdown: { critical: 20, high: 45, medium: 25, low: 5 },
    average_resolution_days: 1.5
  },
  'demo-off-4': {
    officer_name: 'David Chen',
    department_name: 'Infrastructure & Roads',
    total_assigned: 180,
    active_workload: 28,
    resolved: 130,
    pending: 18,
    in_progress: 10,
    rejected: 12,
    duplicate: 8,
    withdrawn: 2,
    resolution_rate: 85.5,
    priority_breakdown: { critical: 60, high: 75, medium: 35, low: 10 },
    average_resolution_days: 4.1
  },
  'demo-off-5': {
    officer_name: 'Aisha Patel',
    department_name: 'Water & Sanitation',
    total_assigned: 25,
    active_workload: 15,
    resolved: 8,
    pending: 10,
    in_progress: 5,
    rejected: 1,
    duplicate: 1,
    withdrawn: 0,
    resolution_rate: 80.0,
    priority_breakdown: { critical: 2, high: 8, medium: 10, low: 5 },
    average_resolution_days: 6.2
  },
};

export const getDemoDepartments = async () => {
  return new Promise((resolve) => setTimeout(() => resolve(DEMO_DEPARTMENTS), 300));
};

export const getDemoOfficers = async (departmentId = null) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (departmentId && typeof departmentId === "string") {
        resolve(DEMO_OFFICERS.filter(o => o.department_id === departmentId));
      } else {
        resolve(DEMO_OFFICERS);
      }
    }, 300);
  });
};

export const getDemoOfficerAnalytics = async (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const data = DEMO_ANALYTICS[id];
      if (data) resolve(data);
      else reject(new Error("Demo officer not found"));
    }, 400);
  });
};
