* Remove obsolete color spaces from export: ucs, uvw
* add more single-tone visualising spaces alike cubehelix
	* default spectrogram imprint
	* gray
	* spectrum
	* temperature
	* sky
	...
	* In fact it needs 2-color mixing function via lch-like space
* add proper space & channel names (caps) - fix depending on that color2.
* implement asm-js way to convert spaces (promises to be times faster)