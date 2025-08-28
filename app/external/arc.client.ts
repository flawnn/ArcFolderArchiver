import axios from "axios";
import * as cheerio from "cheerio";
import { type ArcFolder, ArcFolderSchema } from "./models/arc";

class ArcClient {
  async extractFolderData(url: string): Promise<ArcFolder | null> {
    try {
      // Check if Arc URL
      this.checkArcUrl(url);

      const response = await axios.get(url);

      const doc = cheerio.load(response.data);

      const scriptContent = doc("#__NEXT_DATA__").html();

      if (!scriptContent)
        throw new Error("Error finding script content in Arc Share Page");

      const jsonData = JSON.parse(scriptContent);

      const result = ArcFolderSchema.safeParse(jsonData.props.pageProps);
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

  private checkArcUrl(url: string) {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname !== "arc.net") {
        throw new Error("URL must be from arc.net domain");
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error("Invalid URL format");
      }
      throw error;
    }
  }
}

export const arcClient = new ArcClient();
