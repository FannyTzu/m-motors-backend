import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const BUCKET_DOCUMENTS =
  process.env.SUPABASE_BUCKET_DOCUMENTS || "m-motors-documents-folder"; // PRIVÉ car documents clients
export const BUCKET_VEHICLES =
  process.env.SUPABASE_BUCKET_VEHICLES || "m-motors-vehicle-pix"; // PUBLIC car photos véhicules
