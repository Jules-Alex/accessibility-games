import { Routes } from '@angular/router';
import {
  AccueilComponent,
  AnimateurComponent,
  DefiHostComponent,
  EngagementComponent,
  ResultatComponent,
  defiGuard,
  resultatGuard,
} from '@ag/screens';

export const routes: Routes = [
  { path: '', component: AccueilComponent, title: 'Accessibility Games' },
  { path: 'defi/:id', component: DefiHostComponent, canActivate: [defiGuard], title: 'Défi — Accessibility Games' },
  { path: 'resultat', component: ResultatComponent, canActivate: [resultatGuard], title: 'Résultat — Accessibility Games' },
  { path: 'engagement', component: EngagementComponent, canActivate: [resultatGuard], title: 'Engagement — Accessibility Games' },
  { path: 'animateur', component: AnimateurComponent, title: 'Présentateurs — Accessibility Games' },
  { path: '**', redirectTo: '' },
];
