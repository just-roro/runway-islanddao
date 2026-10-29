import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { AUDIO_FILES, SFX, eventSound } from '../src/services/audioCatalog';
import { AUDIO_MILESTONES, crossedAudio } from '../src/services/audioTimeline';
import { TIMING, CLOUD_DECK } from '../src/core/simulation';
describe('supplied audio and canonical event routing', () => {
    it('ships valid WAVs for every mapped file and avoids retired mechanics', () => { for (const name of AUDIO_FILES) {
        const path = new URL('../public/assets/sfx/' + name, import.meta.url);
        expect(existsSync(path)).toBe(true);
        const bytes = readFileSync(path);
        if(name.endsWith('.wav')){expect(bytes.toString('ascii',0,4)).toBe('RIFF');expect(bytes.toString('ascii',8,12)).toBe('WAVE');}else expect(bytes.toString('ascii',4,8)).toBe('ftyp');
    } expect(AUDIO_FILES.some(f => /seeker|customer|kyc|sleep/.test(f))).toBe(false); });
    it('distinguishes Delivery and large rewards from actual losses; no default sound for zero-money notices', () => { expect(eventSound('delivery', 5000)).toBe('delivery'); expect(eventSound('term', 150000)).toBe('term'); expect(eventSound('tower', -37500)).toBe('loss'); expect(eventSound('tower', 0)).toBeUndefined(); expect(eventSound('splashdown', -1000)).toBeUndefined(); expect(eventSound('sequence-ring', 0)).toBe('ring'); expect(eventSound('sequence-missed', 0)).toBeUndefined(); expect(SFX.term.priority).toBeGreaterThan(SFX.sol.priority); });
    it('crosses cinematic cues exactly once at 30/60 FPS, including accelerated route time', () => { for (const fps of [30, 60])
        for (const speed of [1, 1.25]) {
            let before = 0;
            const events = [];
            while (before < CLOUD_DECK.exit + 1) {
                const after = before + speed / fps;
                events.push(...crossedAudio(before, after));
                before = after;
            }
            expect(events).toEqual(AUDIO_MILESTONES.map(([k]) => k));
        } expect(crossedAudio(2.45, 2.47)).toEqual(['jump']); expect(crossedAudio(TIMING.cloud + .1, TIMING.cloud + .15)).toEqual(['parachute']); expect(crossedAudio(20, 20)).toEqual([]); });
});
