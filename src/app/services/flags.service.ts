import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Flag {
  id: number;
  name: string;
  source: string;
}

@Injectable({
  providedIn: 'root'
})
export class FlagsService {
  private readonly flagsUrl = 'data/flags.json';

  constructor(private http: HttpClient) {}

  getFlags(): Observable<{ flags: Flag[] }> {
    return this.http.get<{ flags: Flag[] }>(this.flagsUrl);
  }
}