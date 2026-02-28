# Quick Reference: Running & Testing

## Backend Setup

### 1. Start Backend Server
```bash
cd backend
npm install  # if needed
node server.js
```

Expected output:
```
Medical Wallet Backend API
================================
Server running on port 5000
Environment: development
Local: http://localhost:5000/api
Network: http://10.164.220.89:5000/api
Health Check: http://localhost:5000/api/health
================================
```

### 2. Verify Database Connection
```bash
curl http://localhost:5000/api/health
```

Response should show: `{"status":"OK","message":"Medical Wallet API is running","database":"Connected"}`

---

## Testing Workflows

### Test 1: Complete Profile After Signup
1. Signup with account
2. Fill ProfileDetailsScreen with all fields:
   - Blood Group: O+
   - Gender: Male
   - DOB: 15/01/1990
   - Height: 180
   - Weight: 75
   - Chronic Conditions: Diabetes
   - Allergies: Penicillin
3. Click "Save Profile"
4. Verify in database:
   ```sql
   SELECT demographics, allergies FROM patients WHERE patient_id = 'PXXXX' LIMIT 1;
   ```

### Test 2: View Profile on Login
1. Login with completed profile
2. Navigate to Profile screen
3. Verify stats card shows:
   - Blood Group: O+ ✓
   - Gender: Male ✓
   - DOB: 15/Jan/1990 ✓

### Test 3: Edit Personal Info
1. From Profile, click "Edit Profile"
2. Verify form is populated with:
   - Full Name (read-only)
   - Email (read-only)
   - Phone (read-only)
   - Date of Birth (editable)
   - Gender (editable dropdown)
   - Blood Group (editable dropdown)
   - Height (editable)
   - Weight (editable)
3. Change blood group to AB+
4. Change gender to Female
5. Click "Save Changes"
6. Go back to ProfileScreen
7. Verify blood group changed to AB+

### Test 4: Verify Address Field Removed
1. Open EditPersonalInfo screen
2. Scroll through entire form
3. Confirm NO address field exists ✓

### Test 5: API Endpoints
Test each endpoint manually using curl or Postman:

#### Save Demographics
```bash
curl -X POST http://localhost:5000/api/patients/demographics \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "dob": "1990-01-15",
    "gender": "Male",
    "bloodType": "O+",
    "height": 180,
    "weight": 75,
    "chronicConditions": "Diabetes",
    "allergies": "Penicillin"
  }'
```

#### Fetch Demographics
```bash
curl http://localhost:5000/api/patients/P0001/demographics
```

#### Update Demographics
```bash
curl -X PUT http://localhost:5000/api/patients/P0001/demographics \
  -H "Content-Type: application/json" \
  -d '{
    "gender": "Female",
    "bloodType": "AB+",
    "height": 165,
    "weight": 60
  }'
```

#### Save Allergies
```bash
curl -X POST http://localhost:5000/api/patients/P0001/allergies \
  -H "Content-Type: application/json" \
  -d '{
    "allergies": ["Penicillin", "Shellfish"]
  }'
```

#### Save Emergency Contacts
```bash
curl -X POST http://localhost:5000/api/patients/P0001/emergency-contacts \
  -H "Content-Type: application/json" \
  -d '{
    "emergency_contacts": [
      {"name": "John Smith", "relation": "Father", "phone": "9876543210"},
      {"name": "Jane Smith", "relation": "Mother", "phone": "9876543211"}
    ]
  }'
```

---

## Common Issues & Solutions

### Issue: Demographics not showing on ProfileScreen
**Solution**: 
- Check AsyncStorage has `patient_id` set
- Verify demographics API endpoint returns data
- Check network tab for failed requests
- Ensure backend has patient demographics saved

### Issue: EditPersonalInfo shows "Loading..." indefinitely
**Solution**:
- Verify patient_id exists in AsyncStorage
- Check backend is running and accessible
- Verify `/api/patients/:patientId/demographics` endpoint returns data
- Check browser console for errors

### Issue: "Patient ID not found" alert in EditPersonalInfo
**Solution**:
- User must complete signup and profile setup first
- Ensure patient_id is stored in AsyncStorage during signup
- Check ProfileDetailsScreen saves patient_id before redirecting

### Issue: Form fields show old data after saving
**Solution**:
- Close and reopen EditPersonalInfo screen
- Pull to refresh if implemented
- Clear cache if persistent

---

## Database Queries

### View All Patient Demographics
```sql
SELECT 
  p.patient_id,
  p.name,
  p.demographics,
  p.allergies,
  p.emergency_contacts,
  u.email,
  u.mobilenumber
FROM patients p
JOIN users u ON p.patient_id = u.patient_id
ORDER BY p.id DESC
LIMIT 10;
```

### Check Specific Patient
```sql
SELECT * FROM patients WHERE patient_id = 'P0001';
```

### View Demographics Structure
```sql
SELECT 
  patient_id, 
  jsonb_pretty(demographics) as demographics_formatted,
  jsonb_pretty(allergies) as allergies_formatted
FROM patients
WHERE patient_id = 'P0001';
```

### Update Demographics Directly (if needed)
```sql
UPDATE patients 
SET demographics = jsonb_set(
  COALESCE(demographics, '{}'::jsonb), 
  '{}', 
  '{"dob":"1990-01-15","gender":"Male","bloodType":"O+","height":180,"weight":75}'::jsonb
)
WHERE patient_id = 'P0001';
```

---

## Performance Notes
- Demographics are fetched on ProfileScreen load
- EditPersonalInfo fetches demographics when screen opens
- All API calls have proper error handling
- Date picker optimized for both iOS and Android
- Data updates are sent via PUT (partial updates)

---

## Next Steps (Optional Enhancements)
1. Add medications screen integration
2. Add vaccinations screen integration  
3. Add allergies & conditions screen integration
4. Add emergency contacts screen integration
5. Implement real-time sync with cloud storage
6. Add photo/avatar upload for profile
7. Implement health metrics charts
