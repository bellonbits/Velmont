export interface Store {
  id: string;
  name: string;
  addressLine: string;
  city: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
}

export const stores: Store[] = [
  {
    id: "muthaiga",
    name: "Velmont Muthaiga Business Center",
    addressLine: "Muthaiga Business Center, Muthaiga",
    city: "Nairobi",
    phone: "+254 793 046 776",
    hours: "Mon–Sat, 9:00am–7:00pm",
    lat: -1.2472,
    lng: 36.826,
  },
];
