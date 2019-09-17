var pianoKeys = [{'keyNo':1, 'name':'A0', 'type':'white', 'whiteKeyNo':1},
				 {'keyNo':2, 'name':'A0#', 'type':'black', 'blackKeyNo':1},
				 {'keyNo':3, 'name':'B0', 'type':'white', 'whiteKeyNo':2},
				 {'keyNo':4, 'name':'C1', 'type':'white', 'whiteKeyNo':3},
				 {'keyNo':5, 'name':'C1#', 'type':'black', 'blackKeyNo':2},
				 {'keyNo':6, 'name':'D1', 'type':'white', 'whiteKeyNo':4},
				 {'keyNo':7, 'name':'D1#', 'type':'black', 'blackKeyNo':3},
				 {'keyNo':8, 'name':'E1', 'type':'white', 'whiteKeyNo':5},
				 {'keyNo':9, 'name':'F1', 'type':'white', 'whiteKeyNo':6},
				 {'keyNo':10, 'name':'F1#', 'type':'black', 'blackKeyNo':4},
				 {'keyNo':11, 'name':'G1', 'type':'white', 'whiteKeyNo':7},
				 {'keyNo':12, 'name':'G1#', 'type':'black', 'blackKeyNo':5},
				 {'keyNo':13, 'name':'A1', 'type':'white', 'whiteKeyNo':8},
				 {'keyNo':14, 'name':'A1#', 'type':'black', 'blackKeyNo':6},
				 {'keyNo':15, 'name':'B1', 'type':'white', 'whiteKeyNo':9},
				 {'keyNo':16, 'name':'C2', 'type':'white', 'whiteKeyNo':10},
				 {'keyNo':17, 'name':'C2#', 'type':'black', 'blackKeyNo':7},
				 {'keyNo':18, 'name':'D2', 'type':'white', 'whiteKeyNo':11},
				 {'keyNo':19, 'name':'D2#', 'type':'black', 'blackKeyNo':8},
				 {'keyNo':20, 'name':'E2', 'type':'white', 'whiteKeyNo':12},
				 {'keyNo':21, 'name':'F2', 'type':'white', 'whiteKeyNo':13},
				 {'keyNo':22, 'name':'F2#', 'type':'black', 'blackKeyNo':9},
				 {'keyNo':23, 'name':'G2', 'type':'white', 'whiteKeyNo':14},
				 {'keyNo':24, 'name':'G2#', 'type':'black', 'blackKeyNo':10},
				 {'keyNo':25, 'name':'A2', 'type':'white', 'whiteKeyNo':15},
				 {'keyNo':26, 'name':'A2#', 'type':'black', 'blackKeyNo':11},
				 {'keyNo':27, 'name':'B2', 'type':'white', 'whiteKeyNo':16},
				 {'keyNo':28, 'name':'C3', 'type':'white', 'whiteKeyNo':17},
				 {'keyNo':29, 'name':'C3#', 'type':'black', 'blackKeyNo':12},
				 {'keyNo':30, 'name':'D3', 'type':'white', 'whiteKeyNo':18},
				 {'keyNo':31, 'name':'D3#', 'type':'black', 'blackKeyNo':13},
				 {'keyNo':32, 'name':'E3', 'type':'white', 'whiteKeyNo':19},
				 {'keyNo':33, 'name':'F3', 'type':'white', 'whiteKeyNo':20},
				 {'keyNo':34, 'name':'F3#', 'type':'black', 'blackKeyNo':14},
				 {'keyNo':35, 'name':'G3', 'type':'white', 'whiteKeyNo':21},
				 {'keyNo':36, 'name':'G3#', 'type':'black', 'blackKeyNo':15},
				 {'keyNo':37, 'name':'A3', 'type':'white', 'whiteKeyNo':22},
				 {'keyNo':38, 'name':'A3#', 'type':'black', 'blackKeyNo':16},
				 {'keyNo':39, 'name':'B3', 'type':'white', 'whiteKeyNo':23},
				 {'keyNo':40, 'name':'C4', 'type':'white', 'whiteKeyNo':24},
				 {'keyNo':41, 'name':'C4#', 'type':'black', 'blackKeyNo':17},
				 {'keyNo':42, 'name':'D4', 'type':'white', 'whiteKeyNo':25},
				 {'keyNo':43, 'name':'D4#', 'type':'black', 'blackKeyNo':18},
				 {'keyNo':44, 'name':'E4', 'type':'white', 'whiteKeyNo':26},
				 {'keyNo':45, 'name':'F4', 'type':'white', 'whiteKeyNo':27},
				 {'keyNo':46, 'name':'F4#', 'type':'black', 'blackKeyNo':19},
				 {'keyNo':47, 'name':'G4', 'type':'white', 'whiteKeyNo':28},
				 {'keyNo':48, 'name':'G4#', 'type':'black', 'blackKeyNo':20},
				 {'keyNo':49, 'name':'A4', 'type':'white', 'whiteKeyNo':29},
				 {'keyNo':50, 'name':'A4#', 'type':'black', 'blackKeyNo':21},
				 {'keyNo':51, 'name':'B4', 'type':'white', 'whiteKeyNo':30},
				 {'keyNo':52, 'name':'C5', 'type':'white', 'whiteKeyNo':31},
				 {'keyNo':53, 'name':'C5#', 'type':'black', 'blackKeyNo':22},
				 {'keyNo':54, 'name':'D5', 'type':'white', 'whiteKeyNo':32},
				 {'keyNo':55, 'name':'D5#', 'type':'black', 'blackKeyNo':23},
				 {'keyNo':56, 'name':'E5', 'type':'white', 'whiteKeyNo':33},
				 {'keyNo':57, 'name':'F5', 'type':'white', 'whiteKeyNo':34},
				 {'keyNo':58, 'name':'F5#', 'type':'black', 'blackKeyNo':24},
				 {'keyNo':59, 'name':'G5', 'type':'white', 'whiteKeyNo':35},
				 {'keyNo':60, 'name':'G5#', 'type':'black', 'blackKeyNo':25},
				 {'keyNo':61, 'name':'A5', 'type':'white', 'whiteKeyNo':36},
				 {'keyNo':62, 'name':'A5#', 'type':'black', 'blackKeyNo':26},
				 {'keyNo':63, 'name':'B5', 'type':'white', 'whiteKeyNo':37},
				 {'keyNo':64, 'name':'C6', 'type':'white', 'whiteKeyNo':38},
				 {'keyNo':65, 'name':'C6#', 'type':'black', 'blackKeyNo':27},
				 {'keyNo':66, 'name':'D6', 'type':'white', 'whiteKeyNo':39},
				 {'keyNo':67, 'name':'D6#', 'type':'black', 'blackKeyNo':28},
				 {'keyNo':68, 'name':'E6', 'type':'white', 'whiteKeyNo':40},
				 {'keyNo':69, 'name':'F6', 'type':'white', 'whiteKeyNo':41},
				 {'keyNo':70, 'name':'F6#', 'type':'black', 'blackKeyNo':29},
				 {'keyNo':71, 'name':'G6', 'type':'white', 'whiteKeyNo':42},
				 {'keyNo':72, 'name':'G6#', 'type':'black', 'blackKeyNo':30},
				 {'keyNo':73, 'name':'A6', 'type':'white', 'whiteKeyNo':43},
				 {'keyNo':74, 'name':'A6#', 'type':'black', 'blackKeyNo':31},
				 {'keyNo':75, 'name':'B6', 'type':'white', 'whiteKeyNo':44},
				 {'keyNo':76, 'name':'C7', 'type':'white', 'whiteKeyNo':45},
				 {'keyNo':77, 'name':'C7#', 'type':'black', 'blackKeyNo':32},
				 {'keyNo':78, 'name':'D7', 'type':'white', 'whiteKeyNo':46},
				 {'keyNo':79, 'name':'D7#', 'type':'black', 'blackKeyNo':33},
				 {'keyNo':80, 'name':'E7', 'type':'white', 'whiteKeyNo':47},
				 {'keyNo':81, 'name':'F7', 'type':'white', 'whiteKeyNo':48},
				 {'keyNo':82, 'name':'F7#', 'type':'black', 'blackKeyNo':34},
				 {'keyNo':83, 'name':'G7', 'type':'white', 'whiteKeyNo':49},
				 {'keyNo':84, 'name':'G7#', 'type':'black', 'blackKeyNo':35},
				 {'keyNo':85, 'name':'A7', 'type':'white', 'whiteKeyNo':50},
				 {'keyNo':86, 'name':'A7#', 'type':'black', 'blackKeyNo':36},
				 {'keyNo':87, 'name':'B7', 'type':'white', 'whiteKeyNo':51},
				 {'keyNo':88, 'name':'C8', 'type':'white', 'whiteKeyNo':52}];

var pianoSourceFile = ['./sounds/piano_mp3/German Concert D 021 083.mp3',
					   './sounds/piano_mp3/German Concert D 022 083.mp3',
					   './sounds/piano_mp3/German Concert D 023 083.mp3',
					   './sounds/piano_mp3/German Concert D 024 083.mp3',
					   './sounds/piano_mp3/German Concert D 025 083.mp3',
					   './sounds/piano_mp3/German Concert D 026 083.mp3',
					   './sounds/piano_mp3/German Concert D 027 083.mp3',
					   './sounds/piano_mp3/German Concert D 028 083.mp3',
					   './sounds/piano_mp3/German Concert D 029 083.mp3',
					   './sounds/piano_mp3/German Concert D 030 083.mp3',
					   './sounds/piano_mp3/German Concert D 031 083.mp3',
					   './sounds/piano_mp3/German Concert D 032 083.mp3',
					   './sounds/piano_mp3/German Concert D 033 083.mp3',
					   './sounds/piano_mp3/German Concert D 034 083.mp3',
					   './sounds/piano_mp3/German Concert D 035 083.mp3',
					   './sounds/piano_mp3/German Concert D 036 083.mp3',
					   './sounds/piano_mp3/German Concert D 037 083.mp3',
					   './sounds/piano_mp3/German Concert D 038 083.mp3',
					   './sounds/piano_mp3/German Concert D 039 083.mp3',
					   './sounds/piano_mp3/German Concert D 040 083.mp3',
					   './sounds/piano_mp3/German Concert D 041 083.mp3',
					   './sounds/piano_mp3/German Concert D 042 083.mp3',
					   './sounds/piano_mp3/German Concert D 043 083.mp3',
					   './sounds/piano_mp3/German Concert D 044 083.mp3',
					   './sounds/piano_mp3/German Concert D 045 083.mp3',
					   './sounds/piano_mp3/German Concert D 046 083.mp3',
					   './sounds/piano_mp3/German Concert D 047 083.mp3',
					   './sounds/piano_mp3/German Concert D 048 083.mp3',
					   './sounds/piano_mp3/German Concert D 049 083.mp3',
					   './sounds/piano_mp3/German Concert D 050 083.mp3',
					   './sounds/piano_mp3/German Concert D 051 083.mp3',
					   './sounds/piano_mp3/German Concert D 052 083.mp3',
					   './sounds/piano_mp3/German Concert D 053 083.mp3',
					   './sounds/piano_mp3/German Concert D 054 083.mp3',
					   './sounds/piano_mp3/German Concert D 055 083.mp3',
					   './sounds/piano_mp3/German Concert D 056 083.mp3',
					   './sounds/piano_mp3/German Concert D 057 083.mp3',
					   './sounds/piano_mp3/German Concert D 058 083.mp3',
					   './sounds/piano_mp3/German Concert D 059 083.mp3',
					   './sounds/piano_mp3/German Concert D 060 083.mp3',
					   './sounds/piano_mp3/German Concert D 061 083.mp3',
					   './sounds/piano_mp3/German Concert D 062 083.mp3',
					   './sounds/piano_mp3/German Concert D 063 083.mp3',
					   './sounds/piano_mp3/German Concert D 064 083.mp3',
					   './sounds/piano_mp3/German Concert D 065 083.mp3',
					   './sounds/piano_mp3/German Concert D 066 083.mp3',
					   './sounds/piano_mp3/German Concert D 067 083.mp3',
					   './sounds/piano_mp3/German Concert D 068 083.mp3',
					   './sounds/piano_mp3/German Concert D 069 083.mp3',
					   './sounds/piano_mp3/German Concert D 070 083.mp3',
					   './sounds/piano_mp3/German Concert D 071 083.mp3',
					   './sounds/piano_mp3/German Concert D 072 083.mp3',
					   './sounds/piano_mp3/German Concert D 073 083.mp3',
					   './sounds/piano_mp3/German Concert D 074 083.mp3',
					   './sounds/piano_mp3/German Concert D 075 083.mp3',
					   './sounds/piano_mp3/German Concert D 076 083.mp3',
					   './sounds/piano_mp3/German Concert D 077 083.mp3',
					   './sounds/piano_mp3/German Concert D 078 083.mp3',
					   './sounds/piano_mp3/German Concert D 079 083.mp3',
					   './sounds/piano_mp3/German Concert D 080 083.mp3',
					   './sounds/piano_mp3/German Concert D 081 083.mp3',
					   './sounds/piano_mp3/German Concert D 082 083.mp3',
					   './sounds/piano_mp3/German Concert D 083 083.mp3',
					   './sounds/piano_mp3/German Concert D 084 083.mp3',
					   './sounds/piano_mp3/German Concert D 085 083.mp3',
					   './sounds/piano_mp3/German Concert D 086 083.mp3',
					   './sounds/piano_mp3/German Concert D 087 083.mp3',
					   './sounds/piano_mp3/German Concert D 088 083.mp3',
					   './sounds/piano_mp3/German Concert D 089 083.mp3',
					   './sounds/piano_mp3/German Concert D 090 083.mp3',
					   './sounds/piano_mp3/German Concert D 091 083.mp3',
					   './sounds/piano_mp3/German Concert D 092 083.mp3',
					   './sounds/piano_mp3/German Concert D 093 083.mp3',
					   './sounds/piano_mp3/German Concert D 094 083.mp3',
					   './sounds/piano_mp3/German Concert D 095 083.mp3',
					   './sounds/piano_mp3/German Concert D 096 083.mp3',
					   './sounds/piano_mp3/German Concert D 097 083.mp3',
					   './sounds/piano_mp3/German Concert D 098 083.mp3',
					   './sounds/piano_mp3/German Concert D 099 083.mp3',
					   './sounds/piano_mp3/German Concert D 100 083.mp3',
					   './sounds/piano_mp3/German Concert D 101 083.mp3',
					   './sounds/piano_mp3/German Concert D 102 083.mp3',
					   './sounds/piano_mp3/German Concert D 103 083.mp3',
					   './sounds/piano_mp3/German Concert D 104 083.mp3',
					   './sounds/piano_mp3/German Concert D 105 083.mp3',
					   './sounds/piano_mp3/German Concert D 106 083.mp3',
					   './sounds/piano_mp3/German Concert D 107 083.mp3',
					   './sounds/piano_mp3/German Concert D 108 083.mp3'];