import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { SelectModeComponent } from './pages/select-mode/select-mode.component';
import { ResultsComponent } from './pages/results/results.component';
import { LeaderboardComponent } from './pages/leaderboard/leaderboard.component';
import { AboutComponent } from './pages/about/about.component';
import { HowToPlayComponent } from './pages/how-to-play/how-to-play.component';
import { StreetviewmodeComponent } from './pages/game/streetviewmode/streetviewmode.component';
import { LandmarksmodeComponent } from './pages/game/landmarksmode/landmarksmode.component';
import { FlagsmodeComponent } from './pages/game/flagsmode/flagsmode.component';
import { ResultsflagsComponent } from './pages/resultsflags/resultsflags.component';
import { ResultslandmarksComponent } from './pages/game/resultslandmarks/resultslandmarks.component';
import { FlagsMComponent } from './pages/game/flags-maplibre/flagsm.component';



export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'select-mode', component: SelectModeComponent },
  { path: 'streetview', component: StreetviewmodeComponent },
  { path: 'landmarks' , component:LandmarksmodeComponent},
  { path: 'flags' , component: FlagsmodeComponent},
  { path: 'results', component: ResultsComponent },
  { path: 'leaderboard', component: LeaderboardComponent },
  { path: 'about', component: AboutComponent },
  { path: 'how-to-play', component: HowToPlayComponent },
  { path: 'resultsflags', component: ResultsflagsComponent },
  { path: 'resultslandmarks', component: ResultslandmarksComponent},
  { path: 'flagsm' , component: FlagsMComponent},
  { path: '**', redirectTo: '' } 
];