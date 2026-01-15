import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonParser;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

public class RefinedParser {
    
    private static final String OPENDOTA_API_BASE = "https://api.opendota.com/api";
    private static final long TEST_MATCH_ID = 8643916411L;
    
    private final OkHttpClient httpClient;
    private final Gson gson;
    
    public RefinedParser() {
        this.httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build();
            
        this.gson = new GsonBuilder()
            .setPrettyPrinting()
            .create();
    }
    
    public String fetchMatchData(long matchId) throws IOException {
        String url = OPENDOTA_API_BASE + "/matches/" + matchId;
        
        Request request = new Request.Builder()
            .url(url)
            .get()
            .build();
            
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Failed to fetch match data: " + response.code() + " " + response.message());
            }
            
            String responseBody = response.body().string();
            
            // Pretty print the JSON for analysis
            JsonElement jsonElement = JsonParser.parseString(responseBody);
            String prettyJson = gson.toJson(jsonElement);
            
            return prettyJson;
        }
    }
    
    public static void main(String[] args) {
        RefinedParser parser = new RefinedParser();
        
        try {
            System.out.println("Fetching match data for match ID: " + TEST_MATCH_ID);
            System.out.println("==========================================");
            
            String matchData = parser.fetchMatchData(TEST_MATCH_ID);
            
            System.out.println("Match Data Retrieved:");
            System.out.println(matchData);
            
            // Save to file for analysis
            try {
                java.io.FileWriter writer = new java.io.FileWriter("match_data_opendota_" + TEST_MATCH_ID + ".json");
                writer.write(matchData);
                writer.close();
                System.out.println("\nData saved to: match_data_opendota_" + TEST_MATCH_ID + ".json");
            } catch (IOException e) {
                System.err.println("Error saving data to file: " + e.getMessage());
            }
            
        } catch (IOException e) {
            System.err.println("Error fetching match data: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
