/**
 * India: every State / Union Territory and its main cities / districts.
 * Used by all location fields: pick the State, then the City list shows only
 * that state's cities (a city not in the list can still be typed). Pincode is
 * always typed by hand (6 digits).
 * Same file in the Claim, Admin and Super Admin portals -- keep them in sync.
 */
export const STATE_CITIES = {
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Kakinada', 'Rajahmundry', 'Kadapa', 'Anantapur', 'Eluru', 'Ongole', 'Srikakulam', 'Vizianagaram', 'Chittoor', 'Machilipatnam'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro', 'Bomdila', 'Tezu', 'Aalo', 'Roing'],
    Assam: ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat', 'Nagaon', 'Tezpur', 'Tinsukia', 'Bongaigaon', 'Dhubri', 'Diphu', 'Goalpara', 'Karimganj', 'Sivasagar', 'Barpeta'],
    Bihar: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chapra', 'Sasaram', 'Hajipur', 'Bihar Sharif', 'Motihari', 'Siwan'],
    Chhattisgarh: ['Raipur', 'Bhilai', 'Durg', 'Bilaspur', 'Korba', 'Rajnandgaon', 'Raigarh', 'Jagdalpur', 'Ambikapur', 'Dhamtari', 'Mahasamund'],
    Goa: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Quepem'],
    Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Nadiad', 'Mehsana', 'Bharuch', 'Vapi', 'Navsari', 'Morbi', 'Bhuj', 'Porbandar', 'Valsad'],
    Haryana: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Bahadurgarh', 'Jind', 'Kurukshetra', 'Rewari'],
    'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Mandi', 'Solan', 'Kullu', 'Manali', 'Hamirpur', 'Una', 'Bilaspur', 'Chamba', 'Nahan', 'Palampur'],
    Jharkhand: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro Steel City', 'Deoghar', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Dumka', 'Phusro', 'Chaibasa', 'Medininagar'],
    Karnataka: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Dharwad', 'Belagavi', 'Kalaburagi', 'Davanagere', 'Ballari', 'Vijayapura', 'Shivamogga', 'Tumakuru', 'Udupi', 'Hassan', 'Raichur', 'Bidar', 'Mandya', 'Chitradurga'],
    Kerala: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Alappuzha', 'Palakkad', 'Kottayam', 'Malappuram', 'Kasaragod', 'Pathanamthitta', 'Idukki', 'Wayanad'],
    'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Katni', 'Singrauli', 'Burhanpur', 'Khandwa', 'Chhindwara', 'Morena', 'Bhind', 'Vidisha'],
    Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Navi Mumbai', 'Kalyan', 'Vasai-Virar', 'Kolhapur', 'Amravati', 'Sangli', 'Jalgaon', 'Akola', 'Latur', 'Ahmednagar', 'Dhule', 'Nanded', 'Satara', 'Ratnagiri', 'Palghar', 'Raigad', 'Chandrapur'],
    Manipur: ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching', 'Ukhrul', 'Senapati'],
    Meghalaya: ['Shillong', 'Tura', 'Jowai', 'Nongstoin', 'Williamnagar', 'Baghmara', 'Nongpoh'],
    Mizoram: ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib', 'Saiha', 'Lawngtlai'],
    Nagaland: ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Mon'],
    Odisha: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda', 'Angul', 'Koraput', 'Kendrapara', 'Jajpur'],
    Punjab: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Moga', 'Firozpur', 'Phagwara', 'Kapurthala', 'Sangrur', 'Barnala', 'Fazilka'],
    Rajasthan: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar', 'Pali', 'Sri Ganganagar', 'Tonk', 'Barmer', 'Jaisalmer', 'Chittorgarh', 'Jhunjhunu', 'Nagaur'],
    Sikkim: ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Rangpo', 'Singtam', 'Jorethang'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Vellore', 'Erode', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Kanchipuram', 'Hosur', 'Nagercoil', 'Karur', 'Cuddalore', 'Kumbakonam'],
    Telangana: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Siddipet', 'Suryapet', 'Secunderabad', 'Miryalaguda'],
    Tripura: ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar', 'Belonia', 'Ambassa', 'Khowai'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Noida', 'Greater Noida', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Jhansi', 'Firozabad', 'Mathura', 'Ayodhya', 'Muzaffarnagar', 'Shahjahanpur', 'Rampur', 'Etawah', 'Sitapur', 'Hapur'],
    Uttarakhand: ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Nainital', 'Almora', 'Pithoragarh', 'Kotdwar', 'Mussoorie'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Kharagpur', 'Haldia', 'Darjeeling', 'Jalpaiguri', 'Krishnanagar', 'Barasat', 'Bahrampur', 'Cooch Behar', 'Bankura'],
    'Andaman and Nicobar Islands': ['Port Blair', 'Car Nicobar', 'Mayabunder', 'Diglipur', 'Rangat'],
    Chandigarh: ['Chandigarh'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa'],
    Delhi: ['New Delhi', 'Delhi', 'Dwarka', 'Rohini', 'Saket', 'Karol Bagh', 'Laxmi Nagar', 'Janakpuri', 'Narela', 'Shahdara'],
    'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Kathua', 'Udhampur', 'Sopore', 'Pulwama', 'Rajouri', 'Poonch', 'Kupwara'],
    Ladakh: ['Leh', 'Kargil'],
    Lakshadweep: ['Kavaratti', 'Agatti', 'Minicoy', 'Amini', 'Andrott'],
    Puducherry: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
};

/** All States / UTs, A-Z. */
export const INDIA_STATES = Object.keys(STATE_CITIES).sort((a, b) => a.localeCompare(b));

/** Cities of a state (A-Z); [] when no state is picked. */
export const citiesOf = (state) => [...(STATE_CITIES[state] ?? [])].sort((a, b) => a.localeCompare(b));

/** A valid Indian pincode: 6 digits, not starting with 0. */
export const PIN_RE = /^[1-9][0-9]{5}$/;

/** Keeps only digits, max 6 (for typing a pincode by hand). */
export const pinInput = (text) => String(text ?? '').replace(/\D/g, '').slice(0, 6);

/** Admin portal region (North / South / East / West / Central) of every State / UT. */
export const REGION_OF_STATE = {
    Delhi: 'North', 'Uttar Pradesh': 'North', Haryana: 'North', Punjab: 'North', Rajasthan: 'North', Uttarakhand: 'North',
    'Himachal Pradesh': 'North', 'Jammu and Kashmir': 'North', Ladakh: 'North', Chandigarh: 'North',
    Maharashtra: 'West', Gujarat: 'West', Goa: 'West', 'Dadra and Nagar Haveli and Daman and Diu': 'West',
    Karnataka: 'South', 'Tamil Nadu': 'South', Kerala: 'South', Telangana: 'South', 'Andhra Pradesh': 'South', Puducherry: 'South',
    Lakshadweep: 'South', 'Andaman and Nicobar Islands': 'South',
    'West Bengal': 'East', Odisha: 'East', Bihar: 'East', Jharkhand: 'East', Assam: 'East', Sikkim: 'East', 'Arunachal Pradesh': 'East',
    Manipur: 'East', Meghalaya: 'East', Mizoram: 'East', Nagaland: 'East', Tripura: 'East',
    'Madhya Pradesh': 'Central', Chhattisgarh: 'Central',
};
