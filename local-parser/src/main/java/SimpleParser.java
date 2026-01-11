import skadistats.clarity.Clarity;
import skadistats.clarity.wire.common.proto.Demo.CDemoFileInfo;
import skadistats.clarity.wire.common.proto.Demo.CGameInfo;
// Note: Imports for protobufs vary by Clarity version. 
// Clarity 2.x exposes them under skadistats.clarity.wire...
// We will use reflection or exact paths if known. 
// Actually, Clarity helper `infoForFile` returns the raw protobuf object.
// Let's try standard access.

import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.List;

public class SimpleParser {

    public static void main(String[] args) {
        if (args.length == 0) {
            System.err.println("Usage: java -jar dota-parser.jar <demofile>");
            System.exit(1);
        }

        String filename = args[0];

        try {
            // Retrieve file info (Summary)
            CDemoFileInfo info = Clarity.infoForFile(filename);

            if (info == null) {
                System.err.println("Error: Could not retrieve file info.");
                System.exit(1);
            }

            CGameInfo.CDotaGameInfo dotaInfo = info.getGameInfo().getDota();

            long matchId = dotaInfo.getMatchId();
            int winner = dotaInfo.getGameWinner(); // 2 = Radiant, 3 = Dire
            long timestamp = dotaInfo.getEndTime();

            StringBuilder json = new StringBuilder();
            json.append("{\n");
            json.append("  \"matchId\": ").append(matchId).append(",\n");
            json.append("  \"timestamp\": ").append(timestamp * 1000L).append(",\n");
            json.append("  \"winner\": \"").append(winner == 2 ? "Radiant" : "Dire").append("\",\n");
            json.append("  \"players\": []\n");
            json.append("}");
            System.out.println(json.toString());

        } catch (Exception e) {
            System.err.println("Error parsing replay: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}
