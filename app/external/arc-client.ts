import axios from "axios";
import * as cheerio from "cheerio";
import { type ArcFolder, ArcFolderSchema } from "./models/arc";

class ArcClient {
  async extractFolderData(arcId: string): Promise<ArcFolder | null> {
    try {
      const arcFolderURL = `https://arc.net/folder/${arcId}`;

      const response = await axios.get(arcFolderURL);

      const doc = cheerio.load(response.data);

      const scriptContent = doc("#__NEXT_DATA__").html();

      if (!scriptContent)
        throw new Error("Error finding script content in Arc Share Page");

      const jsonData = JSON.parse(scriptContent);

      const result = ArcFolderSchema.safeParse(jsonData.props.pageProps, {
        reportInput: true,
      });
      if (result.success) {
        return result.data;
      } else {
        console.log(result.error);
        throw new Error("Arc Folder Parsing Issue: " + result.error);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("Error fetching HTML:", error.message);
      } else {
        console.error("Error fetching HTML:", error);
      }
      throw error;
    }
  }
}

export const arcClient = new ArcClient();
