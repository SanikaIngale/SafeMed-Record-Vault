-- Create QR codes table to store patient QR code data
CREATE TABLE IF NOT EXISTS qr_codes (
  id SERIAL PRIMARY KEY,
  patient_id VARCHAR(20) NOT NULL UNIQUE,
  qr_data JSONB NOT NULL,
  qr_image_base64 TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_qr_codes_patient_id ON qr_codes(patient_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_qr_codes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS qr_codes_timestamp ON qr_codes;
CREATE TRIGGER qr_codes_timestamp
  BEFORE UPDATE ON qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_qr_codes_timestamp();
