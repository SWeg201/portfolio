→ **Clean-Up**  
EN: Reparents specific objects into the target group `"SC"`.  
Afterwards, it deletes groups used for rigging and control (such as Skeleton, Geometry Master, etc.).

→ **ClipExport Helper**  
EN: Reads the clips (or their IDs) on Track 1 in the Time Editor, internally sorts them based on their start time, and adds them to the Game Exporter.  
Replaces presets: The preset settings are located in the method `proc_set_Preset_Settings` and can be modified or extended as needed.
