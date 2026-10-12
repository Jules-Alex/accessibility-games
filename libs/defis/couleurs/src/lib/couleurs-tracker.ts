import { Injectable } from '@angular/core';
import { DecisionsTracker } from '@ag/state';

/** Décisions du défi 4 (une instance par défi : le défi 5 a la sienne). */
@Injectable({ providedIn: 'root' })
export class CouleursTracker extends DecisionsTracker {}
