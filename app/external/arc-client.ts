import axios from "axios";
import * as cheerio from "cheerio";
import { type ArcFolder, ArcFolderSchema } from "./models/arc";

export type ArcShareKind = "folder" | "space";

class ArcClient {
  async extractShareData(
    arcId: string,
    shareKind?: ArcShareKind,
  ): Promise<ArcFolder | null> {
    const kinds: ArcShareKind[] = shareKind
      ? [shareKind]
      : ["folder", "space"];

    let lastError: unknown;

    for (const kind of kinds) {
      try {
        const parsed = await this.fetchAndParseShare(arcId, kind);
        if (parsed) return parsed;
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) throw lastError;
    return null;
  }

  /** @deprecated Use extractShareData */
  async extractFolderData(
    arcId: string,
    shareKind?: ArcShareKind,
  ): Promise<ArcFolder | null> {
    return this.extractShareData(arcId, shareKind);
  }

  private async fetchAndParseShare(
    arcId: string,
    shareKind: ArcShareKind,
  ): Promise<ArcFolder | null> {
    const arcShareURL = `https://arc.net/${shareKind}/${arcId}`;
    const response = await axios.get(arcShareURL);
    const doc = cheerio.load(response.data);
    const scriptContent = doc("#__NEXT_DATA__").html();

    if (!scriptContent) {
      throw new Error("Error finding script content in Arc Share Page");
    }

    const jsonData = JSON.parse(scriptContent);
    const result = ArcFolderSchema.safeParse(jsonData.props.pageProps, {
      reportInput: true,
    });

    if (result.success) {
      return result.data;
    }

    console.log(result.error);
    throw new Error("Arc Share Parsing Issue: " + result.error);
  }
}

export const arcClient = new ArcClient();
