import tkinter as tk
from tkinter import PhotoImage

#Icon by https://www.flaticon.com/free-icon/system_3247956?term=work&page=1&position=13&origin=search&related_id=3247956

def create_gui(master, browse_output_folder, browse_render_exe_folder, browse_batch_file_directory, select_file, init_batch_generation, run_batch_file, open_help_dialog, render_executable_path, output_folder, batch_file_path):
    master.title("PUPPETEERS MAYA RENDERING TOOLKIT")
    master.geometry("850x650")
    master.config(bg="#333333")  # Dark gray color
    icon_image = PhotoImage(file="icon.png")
    master.iconphoto(False, icon_image)

    title_label = tk.Label(master, text="PUPPETEERS Maya Rendering Toolkit", font=("Roboto", 16), bg="#333333", fg="white")
    title_label.pack(pady=10)

    # Create a frame for the labels
    label_frame = tk.Frame(master, bg="#333333")
    label_frame.pack(padx=10, pady=10, anchor="center")

    # Create labels for the prefix and path
    label_render_exe = tk.Label(label_frame, text="Render.exe Path: ", bg="#333333", fg="white")
    label_render_exe.grid(row=0, column=0, sticky="w")
    label_render_path = tk.Label(label_frame, text=render_executable_path, bg="#333333", fg="#BBBBBB")
    label_render_path.grid(row=0, column=1, sticky="w")

    output_folder_label = tk.Label(label_frame, text="Output Folder: ", bg="#333333", fg="white")
    output_folder_label.grid(row=1, column=0, sticky="w")
    label_output_folder_path = tk.Label(label_frame, text=output_folder, bg="#333333", fg="#BBBBBB")
    label_output_folder_path.grid(row=1, column=1, sticky="w")

    batch_file_path_label = tk.Label(label_frame, text="Batch File Directory: ", bg="#333333", fg="white")
    batch_file_path_label.grid(row=2, column=0, sticky="w")
    label_batch_file_path = tk.Label(label_frame, text=batch_file_path, bg="#333333", fg="#BBBBBB")
    label_batch_file_path.grid(row=2, column=1, sticky="w")

    render_scenes_label = tk.Label(label_frame, text="Render Scenes: ", bg="#333333", fg="white")
    render_scenes_label.grid(row=3, column=0, pady=20, sticky="ws")
    render_scenes_status = tk.Label(label_frame, text="----WARNING: No render scenes added to the list----", bg="#333333", fg="#BBBBBB")
    render_scenes_status.grid(row=3, column=1, sticky="w")

    # Create buttons
    browse_render_path_button = tk.Button(label_frame, text="Browse Render.exe Path", command=browse_render_exe_folder, bg="#555555", fg="white")
    browse_render_path_button.grid(row=0, column=3, padx=50, pady=5, sticky="nsew")
    browse_output_button = tk.Button(label_frame, text="Browse Output Folder", command=browse_output_folder, bg="#555555", fg="white")
    browse_output_button.grid(row=1, column=3, padx=50, pady=5, sticky="nsew")
    browse_batch_file_button = tk.Button(label_frame, text="Browse Batch File Directory", command=browse_batch_file_directory, bg="#555555", fg="white")
    browse_batch_file_button.grid(row=2, column=3, padx=50, pady=5, sticky="nsew")
    select_scene_button = tk.Button(label_frame, text="Add Scene File (.mb or .ma)", command=select_file, bg="#555555", fg="white")
    select_scene_button.grid(row=3, column=3, padx=50, pady=5, sticky="nsew")

    # Create a frame to contain the scene file entries
    scene_files_frame = tk.Frame(master, bg="#333333")
    scene_files_frame.pack(pady=10, padx=10, fill="both", expand=True)

    # Create a frame to contain the buttons for output folder and batch file directory
    button_frame = tk.Frame(master, bg="#333333")
    button_frame.pack(pady=10)

    # Command for the button to write to the batch file
    write_to_batch_command = lambda: init_batch_generation()

    # Create the Label for "Batch File Name" Entry
    batch_file_name_label = tk.Label(button_frame, text="Batch File Name: ", bg="#333333", fg="white")
    batch_file_name_label.pack(side=tk.LEFT, padx=5)

    # Create the Entry field for the batch file name
    batch_file_name_entry = tk.Entry(button_frame, bg="#555555", fg="white")
    batch_file_name_entry.pack(side=tk.LEFT, padx=5)

    # Create the "Write to Batch File" button
    write_to_batch_button = tk.Button(button_frame, text="Write to Batch File", command=write_to_batch_command, bg="#555555", fg="white")
    write_to_batch_button.pack(side=tk.LEFT, padx=5)

    # Create the "Run Batch File" button
    run_batch_button = tk.Button(button_frame, text="Run Batch File", command=run_batch_file, bg="#555555", fg="white", state="normal")
    run_batch_button.pack(side=tk.LEFT, padx=5)

    # Function to open help dialog
    help_button = tk.Button(button_frame, text="Help", command=open_help_dialog, bg="#555555", fg="white")
    help_button.pack(side=tk.LEFT, padx=5)

    return master, label_render_path, label_output_folder_path, label_batch_file_path, render_scenes_label, render_scenes_status, batch_file_name_entry, scene_files_frame, run_batch_button
