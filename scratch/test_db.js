import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wcewgxkizvsnffhbqqet.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjZXdneGtpenZzbmZmaGJxcWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NTUwNDIsImV4cCI6MjA5MjMzMTA0Mn0.CeQqKNJKevS8RmQf-VMwOlJzvMpJWp1HUdswZRnufFo";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  try {
    const { data, error } = await supabase.from('productos').select('*');
    if (error) {
      console.error('Error fetching products:', error);
    } else {
      console.log('Successfully fetched products. Count:', data.length);
      if (data.length > 0) {
        console.log('Sample product:', data[0]);
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

test();
