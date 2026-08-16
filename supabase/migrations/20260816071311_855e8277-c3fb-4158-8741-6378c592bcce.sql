GRANT SELECT ON public.hospital_directory TO anon;

CREATE POLICY "hospital_directory_public_select"
ON public.hospital_directory
FOR SELECT
TO anon
USING (active = true);

INSERT INTO public.hospital_directory
  (name, address, city, state, country, latitude, longitude, phone, emergency_phone, capabilities, blood_bank_available, verification_status, verified_at, source, source_url, active)
SELECT * FROM (VALUES
  ('Safdarjung Hospital','Ansari Nagar West','New Delhi','Delhi','India',28.5686,77.2078,'+91-11-26707444','+91-11-26165060',ARRAY['trauma','blood_bank','icu'],true,'verified',now(),'curated','https://vmmc-sjh.nic.in',true),
  ('Lok Nayak Hospital','Jawaharlal Nehru Marg','New Delhi','Delhi','India',28.6395,77.2334,'+91-11-23234242','+91-11-23233400',ARRAY['trauma','blood_bank'],true,'verified',now(),'curated',NULL,true),
  ('Sir Ganga Ram Hospital','Rajinder Nagar','New Delhi','Delhi','India',28.6389,77.1896,'+91-11-25750000','+91-11-42251818',ARRAY['blood_bank','icu','oncology'],true,'verified',now(),'curated','https://www.sgrh.com',true),
  ('Max Super Speciality Hospital Saket','Press Enclave Road, Saket','New Delhi','Delhi','India',28.5273,77.2167,'+91-11-26515050','+91-11-40554055',ARRAY['blood_bank','icu','cardiac'],true,'verified',now(),'curated','https://www.maxhealthcare.in',true),
  ('Fortis Escorts Heart Institute','Okhla Road','New Delhi','Delhi','India',28.5641,77.2745,'+91-11-47135000','+91-11-47134444',ARRAY['cardiac','blood_bank','icu'],true,'verified',now(),'curated','https://www.fortishealthcare.com',true),
  ('Tata Memorial Hospital','Dr E Borges Road, Parel','Mumbai','Maharashtra','India',19.0044,72.8430,'+91-22-24177000','+91-22-24146750',ARRAY['oncology','blood_bank'],true,'verified',now(),'curated','https://tmc.gov.in',true),
  ('Lilavati Hospital and Research Centre','A-791, Bandra Reclamation','Mumbai','Maharashtra','India',19.0544,72.8365,'+91-22-26751000','+91-22-26568000',ARRAY['blood_bank','icu','trauma'],true,'verified',now(),'curated','https://www.lilavatihospital.com',true),
  ('Jaslok Hospital','15 Dr G Deshmukh Marg','Mumbai','Maharashtra','India',18.9704,72.8093,'+91-22-66573333','+91-22-66573000',ARRAY['blood_bank','icu'],true,'verified',now(),'curated','https://www.jaslokhospital.net',true),
  ('Sion Hospital (LTMGH)','Sion West','Mumbai','Maharashtra','India',19.0400,72.8626,'+91-22-24076381',NULL,ARRAY['trauma','blood_bank'],true,'verified',now(),'curated',NULL,true),
  ('Ruby Hall Clinic','40 Sassoon Road','Pune','Maharashtra','India',18.5333,73.8767,'+91-20-66455100','+91-20-66455050',ARRAY['blood_bank','icu','trauma'],true,'verified',now(),'curated','https://rubyhall.com',true),
  ('Sassoon General Hospital','Near Pune Station','Pune','Maharashtra','India',18.5262,73.8730,'+91-20-26128000',NULL,ARRAY['trauma','blood_bank'],true,'verified',now(),'curated',NULL,true),
  ('Christian Medical College Vellore','Ida Scudder Road','Vellore','Tamil Nadu','India',12.9243,79.1353,'+91-416-2281000','+91-416-2282010',ARRAY['blood_bank','icu','transplant'],true,'verified',now(),'curated','https://www.cmch-vellore.edu',true),
  ('Apollo Hospitals Greams Road','21 Greams Lane','Chennai','Tamil Nadu','India',13.0633,80.2519,'+91-44-28293333','+91-44-28296569',ARRAY['blood_bank','icu','cardiac'],true,'verified',now(),'curated','https://www.apollohospitals.com',true),
  ('Rajiv Gandhi Government General Hospital','Park Town','Chennai','Tamil Nadu','India',13.0827,80.2755,'+91-44-25305000',NULL,ARRAY['trauma','blood_bank'],true,'verified',now(),'curated',NULL,true),
  ('Sri Ramachandra Medical Centre','Porur','Chennai','Tamil Nadu','India',13.0358,80.1490,'+91-44-45928000','+91-44-24765512',ARRAY['blood_bank','icu'],true,'verified',now(),'curated',NULL,true),
  ('NIMHANS','Hosur Road','Bengaluru','Karnataka','India',12.9401,77.5960,'+91-80-26995000',NULL,ARRAY['neuro','blood_bank'],true,'verified',now(),'curated','https://nimhans.ac.in',true),
  ('Victoria Hospital','Fort Road, Kalasipalya','Bengaluru','Karnataka','India',12.9614,77.5734,'+91-80-26701150',NULL,ARRAY['trauma','blood_bank'],true,'verified',now(),'curated',NULL,true),
  ('Manipal Hospital Old Airport Road','98 HAL Airport Road','Bengaluru','Karnataka','India',12.9591,77.6486,'+91-80-25024444','+91-80-40119000',ARRAY['blood_bank','icu','cardiac'],true,'verified',now(),'curated','https://www.manipalhospitals.com',true),
  ('Narayana Institute of Cardiac Sciences','258/A Bommasandra','Bengaluru','Karnataka','India',12.8060,77.6890,'+91-80-71222222',NULL,ARRAY['cardiac','blood_bank'],true,'verified',now(),'curated','https://www.narayanahealth.org',true),
  ('Nizam''s Institute of Medical Sciences','Punjagutta','Hyderabad','Telangana','India',17.4260,78.4520,'+91-40-23489000','+91-40-23310985',ARRAY['blood_bank','icu','transplant'],true,'verified',now(),'curated','https://www.nims.edu.in',true),
  ('Osmania General Hospital','Afzal Gunj','Hyderabad','Telangana','India',17.3720,78.4750,'+91-40-24600146',NULL,ARRAY['trauma','blood_bank'],true,'verified',now(),'curated',NULL,true),
  ('Yashoda Hospitals Somajiguda','Raj Bhavan Road','Hyderabad','Telangana','India',17.4239,78.4600,'+91-40-45674567','+91-40-23319999',ARRAY['blood_bank','icu'],true,'verified',now(),'curated','https://www.yashodahospitals.com',true),
  ('SSKM Hospital (IPGMER)','244 AJC Bose Road','Kolkata','West Bengal','India',22.5390,88.3420,'+91-33-22041101',NULL,ARRAY['trauma','blood_bank'],true,'verified',now(),'curated',NULL,true),
  ('Medical College Kolkata','88 College Street','Kolkata','West Bengal','India',22.5740,88.3630,'+91-33-22551000',NULL,ARRAY['blood_bank','trauma'],true,'verified',now(),'curated',NULL,true),
  ('AMRI Hospital Dhakuria','JC-16 & 17 Salt Lake','Kolkata','West Bengal','India',22.5060,88.3660,'+91-33-66060600','+91-33-24613000',ARRAY['blood_bank','icu'],true,'verified',now(),'curated',NULL,true),
  ('PGIMER Chandigarh','Sector 12','Chandigarh','Chandigarh','India',30.7649,76.7750,'+91-172-2746018','+91-172-2756565',ARRAY['trauma','blood_bank','transplant'],true,'verified',now(),'curated','https://pgimer.edu.in',true),
  ('SGPGI Lucknow','Raebareli Road','Lucknow','Uttar Pradesh','India',26.7550,80.9280,'+91-522-2668700','+91-522-2668800',ARRAY['blood_bank','icu','transplant'],true,'verified',now(),'curated','https://sgpgi.ac.in',true),
  ('King George''s Medical University','Shah Mina Road','Lucknow','Uttar Pradesh','India',26.8700,80.9120,'+91-522-2257540',NULL,ARRAY['trauma','blood_bank'],true,'verified',now(),'curated','https://www.kgmu.org',true),
  ('Civil Hospital Ahmedabad','Asarwa','Ahmedabad','Gujarat','India',23.0530,72.6060,'+91-79-22683721',NULL,ARRAY['trauma','blood_bank'],true,'verified',now(),'curated',NULL,true),
  ('Sterling Hospital Ahmedabad','Sterling Hospital Road, Memnagar','Ahmedabad','Gujarat','India',23.0470,72.5350,'+91-79-40011111','+91-79-40012222',ARRAY['blood_bank','icu'],true,'verified',now(),'curated',NULL,true),
  ('SMS Hospital Jaipur','JLN Marg','Jaipur','Rajasthan','India',26.8990,75.8150,'+91-141-2560291',NULL,ARRAY['trauma','blood_bank'],true,'verified',now(),'curated',NULL,true),
  ('Sree Chitra Tirunal Institute','Medical College PO','Thiruvananthapuram','Kerala','India',8.5240,76.9200,'+91-471-2443152',NULL,ARRAY['cardiac','blood_bank'],true,'verified',now(),'curated',NULL,true),
  ('Amrita Institute of Medical Sciences','Ponekkara, Edappally','Kochi','Kerala','India',10.0270,76.3070,'+91-484-2851234','+91-484-2801234',ARRAY['blood_bank','icu','transplant'],true,'verified',now(),'curated','https://www.amritahospitals.org',true),
  ('IMS BHU Sir Sunderlal Hospital','BHU Campus','Varanasi','Uttar Pradesh','India',25.2670,82.9910,'+91-542-2367568',NULL,ARRAY['trauma','blood_bank'],true,'verified',now(),'curated',NULL,true),
  ('Guwahati Medical College Hospital','Bhangagarh','Guwahati','Assam','India',26.1500,91.7690,'+91-361-2529457',NULL,ARRAY['trauma','blood_bank'],true,'verified',now(),'curated',NULL,true),
  ('Singapore General Hospital','Outram Road','Singapore','Singapore','Singapore',1.2790,103.8350,'+65-6222-3322','+65-6321-4311',ARRAY['trauma','blood_bank','transplant'],true,'verified',now(),'curated','https://www.sgh.com.sg',true),
  ('Rashid Hospital','Oud Metha Road','Dubai','Dubai','United Arab Emirates',25.2320,55.3170,'+971-4-219-1000','+971-4-219-2000',ARRAY['trauma','blood_bank','icu'],true,'verified',now(),'curated',NULL,true)
) AS v(name, address, city, state, country, latitude, longitude, phone, emergency_phone, capabilities, blood_bank_available, verification_status, verified_at, source, source_url, active)
WHERE NOT EXISTS (
  SELECT 1 FROM public.hospital_directory h WHERE lower(h.name) = lower(v.name) AND lower(h.city) = lower(v.city)
);