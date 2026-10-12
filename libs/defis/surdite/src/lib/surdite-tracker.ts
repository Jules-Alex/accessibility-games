import { Injectable } from '@angular/core';
import { DecisionsTracker } from '@ag/state';

/** Décisions du défi 5 (une instance par défi : le défi 4 a la sienne). */
@Injectable({ providedIn: 'root' })
export class SurditeTracker extends DecisionsTracker {}
