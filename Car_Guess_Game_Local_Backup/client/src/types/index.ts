export interface CarHints {
  body_type: string;
  country: string;
  year: number;
}

export interface Feedback {
  make: 'green' | 'yellow' | 'gray';
  model: 'green' | 'yellow' | 'gray';
  year: 'green' | 'yellow' | 'gray';
  body_type: 'green' | 'yellow' | 'gray';
} 