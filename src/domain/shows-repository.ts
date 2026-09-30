import type { Show } from "./show.js";

export interface ShowsRepository {
  artistExists(artistId: number): Promise<boolean>;
  findActiveByArtistId(artistId: number): Promise<Show[]>;
}