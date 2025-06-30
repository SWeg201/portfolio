***COMMUNICATION WITH MAYA***
- To access Maya, we need to run any corresponding logic using Maya's Python interpreter, mayapy (usually in: C:/Program Files/Autodesk/Maya2024/bin)
- Since mayapy can not be virtualized, it can not be used with virtual environments which are required for system-specific package requirements though
- Thus, we run the main program using the python.exe in the .venv and invoke the MayaSceneHandler.py with mayapy.exe by using Python's subprocess module

    IMPLEMENTATION: 
  - main.py: 
    - Finds Maya Installation location as well as the mayapy.exe location 
    - defines the command that ought to be run by subprocess -> runs subprocess
    - receives the path to the scene file and the callable method as a parameter 
  - MayaSceneHandler.py: 
    - Since it will be called via the mayapy.exe, if __name__ == "__main__": will execute as a standalone script instead of an imported module
    - sys.argv is used to pass command-line arguments to your script
    - sys.argv here corresponds to the arguments passed to the subprocess.run-command (scene_path & method_name)
    - Depending on the passed arguments, the MayaSceneHandler will invoke its corresponding method, then capture & parse the return values 
    - if no method_name is provided, MayaSceneHandler will treat it as None 

NOTE: If further methods are supposed to be called, they need to be passed to the run_maya_method-Method and accounted for in the MayaSceneHandlers control structure.

***BUILDING***
    - go to .venv/Scripts/Activate 
    - pip install pyinstaller (if not already done)
    - pyinstaller main.spec 
    - put pup_icon into the .exe location, otherwise: ERROR & No run :(  

________________________________________________________________________________________________________________________
GENERAL PYTHON INFO: 

***Difference between init (constructor) and if __name__ == "__main__":***
            
if __name__ == "__main__":

This block is a common Python idiom that allows a file to be both executable as a standalone script and importable as a module, making the code more modular and reusable.
This block is not a constructor but a control structure used to determine whether a Python script is being run directly or being imported as a module into another script.

Direct Script Execution:
    When you run a Python file directly from the command line, the special built-in variable __name__ is automatically set to "__main__".
    The if __name__ == "__main__": block is executed only if the script is run directly, meaning when you invoke it like this:
    
    python my_script.py
    Imported as a Module:
Module: 
    If the script is imported into another Python script as a module (using import), the __name__ variable is set to the module's name (i.e., the 
    filename), not "__main__". In this case, the code inside the if __name__ == "__main__": block is not executed. This prevents certain code (like running tests or executing 
    logic) from running when the script is imported as a module, allowing the script to function like a library.
