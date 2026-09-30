export interface StateJurisdiction {
  state: string;
  districts: string[];
}

export const INDIAN_STATES_AND_UTS: StateJurisdiction[] = [
  {
    state: "Andhra Pradesh",
    districts: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Kakinada", "Tirupati", "Kadapa", "Anantapur", "Rajahmundry"]
  },
  {
    state: "Arunachal Pradesh",
    districts: ["Itanagar", "Tawang", "Pasighat", "Ziro", "Naharlagun", "Bomdila"]
  },
  {
    state: "Assam",
    districts: ["Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Nagaon", "Tezpur", "Tinsukia"]
  },
  {
    state: "Bihar",
    districts: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Arrah"]
  },
  {
    state: "Chhattisgarh",
    districts: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Rajnandgaon", "Jagdalpur", "Durg"]
  },
  {
    state: "Goa",
    districts: ["North Goa (Panaji)", "South Goa (Margao)", "Vasco da Gama", "Mapusa", "Ponda"]
  },
  {
    state: "Gujarat",
    districts: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Navsari", "Morbi"]
  },
  {
    state: "Haryana",
    districts: ["Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula"]
  },
  {
    state: "Himachal Pradesh",
    districts: ["Shimla", "Dharamshala", "Mandi", "Solan", "Kullu", "Hamirpur", "Una", "Bilaspur"]
  },
  {
    state: "Jharkhand",
    districts: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh"]
  },
  {
    state: "Karnataka",
    districts: ["Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi", "Kalaburagi", "Davanagere", "Ballari", "Shivamogga"]
  },
  {
    state: "Kerala",
    districts: ["Thiruvananthapuram", "Kochi (Ernakulam)", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Alappuzha", "Kannur", "Kottayam"]
  },
  {
    state: "Madhya Pradesh",
    districts: ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa"]
  },
  {
    state: "Maharashtra",
    districts: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad (Chhatrapati Sambhaji Nagar)", "Thane", "Solapur", "Kolhapur", "Amravati", "Nanded", "Jalgaon", "Akola", "Latur", "Dhule", "Ahmednagar", "Chandrapur"]
  },
  {
    state: "Manipur",
    districts: ["Imphal East", "Imphal West", "Thoubal", "Bishnupur", "Churachandpur"]
  },
  {
    state: "Meghalaya",
    districts: ["Shillong", "Tura", "Jowai", "Nongpoh", "Williamnagar"]
  },
  {
    state: "Mizoram",
    districts: ["Aizawl", "Lunglei", "Champhai", "Kolasib", "Serchhip"]
  },
  {
    state: "Nagaland",
    districts: ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha"]
  },
  {
    state: "Odisha",
    districts: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore"]
  },
  {
    state: "Punjab",
    districts: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali (SAS Nagar)", "Hoshiarpur", "Pathankot"]
  },
  {
    state: "Rajasthan",
    districts: ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Sikar"]
  },
  {
    state: "Sikkim",
    districts: ["Gangtok", "Namchi", "Gyalshing", "Mangan", "Pakyong", "Soreng"]
  },
  {
    state: "Tamil Nadu",
    districts: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tiruppur", "Erode", "Vellore", "Thoothukudi", "Tirunelveli"]
  },
  {
    state: "Telangana",
    districts: ["Hyderabad", "Secunderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahbubnagar", "Nalgonda"]
  },
  {
    state: "Tripura",
    districts: ["Agartala (West Tripura)", "Dharmanagar", "Udaipur", "Kailashahar", "Belonia"]
  },
  {
    state: "Uttar Pradesh",
    districts: ["Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj", "Noida (Gautam Buddha Nagar)", "Ghaziabad", "Meerut", "Aligarh", "Bareilly", "Moradabad", "Gorakhpur"]
  },
  {
    state: "Uttarakhand",
    districts: ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rishikesh", "Nainital", "Rudrapur"]
  },
  {
    state: "West Bengal",
    districts: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Kharagpur", "Malda"]
  },
  // --- Union Territories ---
  {
    state: "Delhi",
    districts: ["New Delhi", "Delhi South", "Delhi North", "Delhi Central", "Delhi East", "Delhi West", "North West Delhi", "North East Delhi", "South West Delhi", "South East Delhi", "Shahdara"]
  },
  {
    state: "Andaman and Nicobar Islands",
    districts: ["Port Blair (South Andaman)", "North and Middle Andaman", "Nicobar"]
  },
  {
    state: "Chandigarh",
    districts: ["Chandigarh Central", "Chandigarh East", "Chandigarh South"]
  },
  {
    state: "Dadra and Nagar Haveli and Daman and Diu",
    districts: ["Daman", "Diu", "Silvassa"]
  },
  {
    state: "Jammu and Kashmir",
    districts: ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Udhampur", "Kathua"]
  },
  {
    state: "Ladakh",
    districts: ["Leh", "Kargil"]
  },
  {
    state: "Lakshadweep",
    districts: ["Kavaratti", "Agatti", "Andrott", "Minicoy"]
  },
  {
    state: "Puducherry",
    districts: ["Puducherry", "Karaikal", "Mahe", "Yanam"]
  }
];

export function getDistrictsForState(stateName: string): string[] {
  const match = INDIAN_STATES_AND_UTS.find(
    (s) => s.state.trim().toLowerCase() === stateName.trim().toLowerCase()
  );
  if (match) {
    return match.districts;
  }
  // Safe default
  return ["Central District", "North District", "South District", "East District", "West District"];
}
