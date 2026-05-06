/**
 * @jest-environment jsdom
 */
import * as pkg from '../lib/index.js';

test('public entry exports NiceSelect', () => {
    expect(pkg.NiceSelect).toBeTruthy();
    expect(typeof pkg.NiceSelect).toBe('function');
});

test('NiceSelect exposes static helpers', () => {
    expect(typeof pkg.NiceSelect.fromData).toBe('function');
    expect(typeof pkg.NiceSelect.extendConfig).toBe('function');
});
