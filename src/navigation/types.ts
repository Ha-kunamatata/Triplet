export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Trips: { screen?: keyof TripStackParamList; params?: object } | undefined;
  Places: undefined;
  Profile: undefined;
};

export type TripStackParamList = {
  TripList: undefined;
  TripDetail: { tripId: string };
  CreateTrip: undefined;
  AddSchedule: { tripDayId: string; scheduleId?: string };
  Diary: { tripId: string };
};

export type PlaceStackParamList = {
  PlaceSearch: undefined;
  PlaceDetail: { placeId: string };
};

export type DiaryStackParamList = {
  DiaryList: { tripId: string };
  DiaryEdit: { tripId: string; diaryId?: string };
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
