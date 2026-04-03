var APP_DATA = {
  "scenes": [
    {
      "id": "0-entrance",
      "name": "Entrance",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 1472,
      "initialViewParameters": {
        "yaw": -3.0483085789647255,
        "pitch": -0.0655254281201838,
        "fov": 1.5521195194347877
      },
      "linkHotspots": [
        {
          "yaw": -3.090972182902373,
          "pitch": -0.08327842915946881,
          "rotation": 0,
          "target": "1-lobby"
        }
      ],
      "infoHotspots": [
        {
          "yaw": -0.10000476561038418,
          "pitch": -0.13034649035354384,
          "title": "Entry/Exit",
          "text": "This is the entrance/exit"
        },
        {
          "yaw": 1.8459450985276966,
          "pitch": -0.04713196424395427,
          "title": "Passenger Information Desk",
          "text": "This is the passenger information desk."
        },
        {
          "yaw": 2.4250945392970937,
          "pitch": -0.27154241984186456,
          "title": "Passenger Assistance Counter",
          "text": "Passenger assistance services are available during airport operating hours."
        }
      ]
    },
    {
      "id": "1-lobby",
      "name": "Lobby",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 1472,
      "initialViewParameters": {
        "yaw": -3.1352701450968556,
        "pitch": -0.03550600207857357,
        "fov": 1.5521195194347877
      },
      "linkHotspots": [
        {
          "yaw": -2.245981821589057,
          "pitch": 0.011299908643987777,
          "rotation": 6.283185307179586,
          "target": "2-ground-floor"
        },
        {
          "yaw": -0.040924788429741454,
          "pitch": -0.12012095508401543,
          "rotation": 0,
          "target": "0-entrance"
        }
      ],
      "infoHotspots": [
        {
          "yaw": -3.1028014365880043,
          "pitch": -0.3573059136306913,
          "title": "Reception",
          "text": "This is the reception."
        },
        {
          "yaw": 2.1831152873499127,
          "pitch": -0.05190466360648749,
          "title": "Airport Operations Office",
          "text": "This is Airport Operations Office"
        },
        {
          "yaw": -1.5056005265208618,
          "pitch": -0.0954311072574825,
          "title": "Airport Cafe",
          "text": "This is Airport Cafe"
        }
      ]
    },
    {
      "id": "2-ground-floor",
      "name": "Ground floor",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 1472,
      "initialViewParameters": {
        "yaw": 3.075421843338023,
        "pitch": 0.001171665529277277,
        "fov": 1.5521195194347877
      },
      "linkHotspots": [
        {
          "yaw": -1.6568101154241326,
          "pitch": -0.08975792876698563,
          "rotation": 0,
          "target": "3-wing-1"
        },
        {
          "yaw": 0.24380011683740754,
          "pitch": -0.1414354277676626,
          "rotation": 0,
          "target": "1-lobby"
        },
        {
          "yaw": 3.1221898045447523,
          "pitch": -0.053936431741655966,
          "rotation": 0,
          "target": "4-ground-floor-2"
        }
      ],
      "infoHotspots": [
        {
          "yaw": 2.293217014093571,
          "pitch": -0.049368357428708265,
          "title": "Elevator",
          "text": "This is the elevator to the first and second floor"
        },
        {
          "yaw": 1.8010855444707277,
          "pitch": -0.05586370046413336,
          "title": "Information Display",
          "text": "This is Information Display"
        }
      ]
    },
    {
      "id": "3-wing-1",
      "name": "Wing 1",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 1472,
      "initialViewParameters": {
        "yaw": 3.0874698171895654,
        "pitch": -0.06186389332052933,
        "fov": 1.5521195194347877
      },
      "linkHotspots": [
        {
          "yaw": -0.013078440802447133,
          "pitch": -0.10656282652726468,
          "rotation": 0,
          "target": "2-ground-floor"
        }
      ],
      "infoHotspots": [
        {
          "yaw": 2.249521303826951,
          "pitch": -0.2883709403142056,
          "title": "Ladies Restroom",
          "text": "This is the ladies washroom"
        },
        {
          "yaw": 2.7388786483134027,
          "pitch": -0.1631162095610268,
          "title": "Men's Restroom",
          "text": "This is the men's restroom."
        },
        {
          "yaw": -2.9332991570449245,
          "pitch": -0.10169974614950839,
          "title": "Security Office",
          "text": "This is the airport security office."
        }
      ]
    },
    {
      "id": "4-ground-floor-2",
      "name": "Ground floor 2",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 1472,
      "initialViewParameters": {
        "yaw": -3.122152393047749,
        "pitch": 0.014039628043910568,
        "fov": 1.5521195194347877
      },
      "linkHotspots": [
        {
          "yaw": -0.02261667583674587,
          "pitch": -0.07004947914438553,
          "rotation": 0,
          "target": "2-ground-floor"
        }
      ],
      "infoHotspots": [
        {
          "yaw": -1.62446364442855,
          "pitch": -0.0436633839502214,
          "title": "Check-in Support Area",
          "text": "This is the check-in support area."
        },
        {
          "yaw": 2.7761349205336394,
          "pitch": -0.006930788262168974,
          "title": "Departure Information Board",
          "text": "This is Departure Information Board"
        },
        {
          "yaw": 2.1178489057208214,
          "pitch": -0.018247308701312193,
          "title": "Arrival Information Board",
          "text": "This is Arrival Information Board"
        }
      ]
    }
  ],
  "name": "Fujairah International Airport Virtual Tour Demo",
  "settings": {
    "mouseViewMode": "drag",
    "autorotateEnabled": false,
    "fullscreenButton": true,
    "viewControlButtons": true
  }
};
