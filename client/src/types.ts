export interface CarHints {
  body_style: string;
  segment: string;
  production_from_year: number;
}

export interface SimilarityValue {
  value: string | number;
  isMatch: boolean;
  isClose?: boolean;
  direction?: 'higher' | 'lower' | null;
}

export interface CarSimilarities {
  brand: SimilarityValue;
  production_from_year: SimilarityValue;
  body_style: SimilarityValue;
  segment: SimilarityValue;
  cylinders?: SimilarityValue;
  displacement?: SimilarityValue;
  power?: SimilarityValue;
  torque?: SimilarityValue;
  fuel_system?: SimilarityValue;
  fuel?: SimilarityValue;
  fuel_capacity?: SimilarityValue;
  top_speed?: SimilarityValue;
  drive_type?: SimilarityValue;
}

export interface CarDetails {
  brand: string;
  model: string;
  production_from_year: number;
  to_year?: number;
  body_style: string;
  segment: string;
  title?: string;
  description?: string;
  engine_speed?: number;
  cylinders?: number;
  displacement?: number;
  power?: number;
  torque?: number;
  fuel_system?: string;
  fuel?: string;
  fuel_capacity?: number;
  top_speed?: number;
  drive_type?: string;
  image_url?: string;
}

export interface GuessFeedback {
  isCorrect: boolean;
  message: string;
  similarities: CarSimilarities | null;
  carDetails: CarDetails | null;
} 