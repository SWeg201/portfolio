import os
import subprocess
import threading
import tkinter as tk
from tkinter import filedialog, ttk
import tkinter.messagebox as messagebox
from subprocess import Popen
from GUIManager import create_gui
class RenderManager:
    def __init__(self):
        self.root = tk.Tk()
        self.render_executable_path = "C:\\Program Files\\Autodesk\\Maya2024\\bin\\Render.exe"
        self.output_folder = "----WARNING: No output folder assigned----"
        self.batch_file_path = "----WARNING: No batch file directory assigned----"
        self.render_scenes = []
        self.batch_file_written = False
        self.start_frame_entry = None
        self.end_frame_entry = None
        self.split_chunks_entry = None
        self.isLicenseValid = False
        self.MAYA_SCENE_HANDLER_SCRIPT = "MayaSceneHandler.py"

        self.root, self.label_render_path, self.label_output_folder_path, \
            self.label_batch_file_path, self.render_scenes_label, self.render_scenes_status, \
            self.batch_file_name_entry, self.scene_files_frame, self.run_batch_button = create_gui( self.root, self.browse_output_folder, self.browse_render_exe_folder,
                                                                                                    self.browse_batch_file_directory, self.select_file,
                                                                                                    self.init_batch_generation, self.run_batch_file, self.open_help_dialog,
                                                                                                    self.render_executable_path, self.output_folder, self.batch_file_path )
    def run(self):
        self.root.mainloop()

    def run_maya_method(self, scene_path, method_name):
        MAYA_LOCATION = os.getenv('MAYA_LOCATION', 'C:/Program Files/Autodesk/Maya2024')
        mayapy_path = os.path.join(MAYA_LOCATION, 'bin', 'mayapy.exe')

        # Prepare the command to run MayaSceneHandler.py
        command = [mayapy_path, 'MayaSceneHandler.py', scene_path, method_name]

        # Run the command
        try:
            result = subprocess.run(command, check=True, text=True, capture_output=True)
            output = result.stdout.strip()  # Get the standard output

            # Assuming the output format is: "Retrieved Start Frame: 1.0 (type: <class 'float'>)"
            if "Retrieved Start Frame:" in output and "Retrieved End Frame:" in output:
                start_frame_line = [line for line in output.splitlines() if "Retrieved Start Frame:" in line][0]
                end_frame_line = [line for line in output.splitlines() if "Retrieved End Frame:" in line][0]

                # Extract frame numbers
                start_frame = float(
                    start_frame_line.split(":")[1].strip().split()[0])
                end_frame = float(
                    end_frame_line.split(":")[1].strip().split()[0])

                print(f"Start Frame: {start_frame}, End Frame: {end_frame}")
                return int(start_frame), int(end_frame)

        except subprocess.CalledProcessError as e:
            print(f"An error occurred: {e.stderr}")

    def browse_output_folder(self):
        folder_path = filedialog.askdirectory()
        if folder_path:
            self.output_folder = folder_path
            self.label_output_folder_path.config(text=self.output_folder)

    def browse_render_exe_folder(self):
        folder_path = filedialog.askdirectory()
        if folder_path:
            self.render_executable_path = folder_path
            self.label_render_path.config(text=self.render_executable_path)

    def browse_batch_file_directory(self):
        folder_path = filedialog.askdirectory()
        if folder_path:
            self.batch_file_path = folder_path
            self.label_batch_file_path.config(text=self.batch_file_path)

    def select_file(self):
        file_path = filedialog.askopenfilename(filetypes=[("Maya Files", "*.mb;*.ma"), ("All files", "*.*")])
        if file_path:
            self.render_scenes.append(file_path)
            self.add_scene_frame(file_path)
            self.update_render_scenes_label()

    def add_scene_frame(self, file_path):
        scene_frame = tk.Frame(self.scene_files_frame, bg="#333333", bd=2, highlightbackground="#D3D3D3",
                               highlightthickness=1)
        scene_frame.pack(pady=5, padx=10, fill="x")

        scene_label = tk.Label(scene_frame, text=file_path, bg="#333333", fg="white", anchor="w")
        scene_label.pack(side=tk.LEFT, fill="x", expand=True)

        # Entry for start frame
        start_frame_label = tk.Label(scene_frame, text="Start Frame:", bg="#333333", fg="white")
        start_frame_label.pack(side=tk.LEFT, padx=5)

        start_frame_entry = tk.Entry(scene_frame, width=5)  # Set width to make it less wide
        start_frame_entry.pack(side=tk.LEFT, padx=5)

        # Entry for end frame
        end_frame_label = tk.Label(scene_frame, text="End Frame:", bg="#333333", fg="white")
        end_frame_label.pack(side=tk.LEFT, padx=5)

        end_frame_entry = tk.Entry(scene_frame, width=5)  # Set width to make it less wide
        end_frame_entry.pack(side=tk.LEFT, padx=5)

        # Entry for split chunks
        split_chunks_label = tk.Label(scene_frame, text="Split Chunks?:", bg="#333333", fg="white")
        split_chunks_label.pack(side=tk.LEFT, padx=5)

        split_chunks_entry = tk.Entry(scene_frame, width=5)  # Set width to make it less wide
        split_chunks_entry.pack(side=tk.LEFT, padx=5)

        # Remove Button X
        remove_button = tk.Button(scene_frame, text="x", command=lambda: self.remove_scene(scene_frame, file_path),
                                  bg="#D3D3D3", fg="#000000")  # Solid black "x"
        remove_button.pack(side=tk.RIGHT)

    def get_scene_frames(self):
        scene_frames = []

        def validate_frame_input(frame_input, file_path):
            """Validate frame input and return as an integer."""
            try:
                return int(frame_input) if frame_input else None
            except ValueError:
                messagebox.showerror("Error", f"Invalid frame values for scene: {file_path}. Frames must be integers.")
                return None

        def calculate_chunks(start_frame, end_frame, chunk_count):
            """Calculate chunk ranges based on start and end frames."""
            total_frames = end_frame - start_frame + 1
            chunk_size = total_frames // chunk_count
            remainder = total_frames % chunk_count

            chunks = []
            for i in range(chunk_count):
                chunk_start = start_frame + i * chunk_size
                chunk_end = chunk_start + chunk_size - 1 + (remainder if i == chunk_count - 1 else 0)
                chunks.append((chunk_start, chunk_end))
            return chunks

        for frame_widget in self.scene_files_frame.winfo_children():
            file_label = frame_widget.winfo_children()[0]
            file_path = file_label.cget("text")

            start_frame_entry = frame_widget.winfo_children()[2]  # Start frame entry field
            end_frame_entry = frame_widget.winfo_children()[4]  # End frame entry field
            chunk_count_entry = frame_widget.winfo_children()[6]  # Chunk count entry field

            start_frame = validate_frame_input(start_frame_entry.get(), file_path)
            end_frame = validate_frame_input(end_frame_entry.get(), file_path)
            chunk_count = validate_frame_input(chunk_count_entry.get(), file_path)

            # Check if only one of start_frame or end_frame is filled
            if (start_frame is not None) != (end_frame is not None):
                messagebox.showwarning("Warning", "Start or End Frame Missing. Reverting to Scene Default.")
                if chunk_count is not None:
                    start_frame, end_frame = self.run_maya_method(file_path, 'get_framerange')
                else:
                    start_frame = None
                    end_frame = None

            if chunk_count is not None:  # Split Chunks provided
                if start_frame is not None and end_frame is not None:
                    chunks = calculate_chunks(start_frame, end_frame, chunk_count)
                    scene_frames.extend([(file_path, chunk_start, chunk_end) for chunk_start, chunk_end in chunks])
                else:
                    # If start or end frame not provided, use default scene framerange
                    start_frame, end_frame = self.run_maya_method(file_path, 'get_framerange')
                    chunks = calculate_chunks(start_frame, end_frame, chunk_count)
                    scene_frames.extend([(file_path, chunk_start, chunk_end) for chunk_start, chunk_end in chunks])
            else:  # No Split Chunks provided
                scene_frames.append((file_path, start_frame, end_frame))

        return scene_frames

    def remove_scene(self, scene_frame, file_path):
        self.render_scenes.remove(file_path)
        scene_frame.destroy()
        self.update_render_scenes_label()

    def update_render_scenes_label(self):
        num_scenes = len(self.render_scenes)
        if num_scenes > 0:
            self.render_scenes_label.config(text="Render Scenes: ")
            self.render_scenes_status.config(text=f"{num_scenes} Render Scene(s) added to the render list")
        else:
            self.render_scenes_label.config(text="Render Scenes: ")
            self.render_scenes_status.config(text="----WARNING: No render scenes added to the list----")

    def init_batch_generation(self):
        if self.output_folder == "----WARNING: No output folder assigned----" or not self.render_executable_path:
            messagebox.showinfo("Error", "Output Folder or Render Executable Path not set.")
            return False

        batch_file_name = self.batch_file_name_entry.get()
        if not batch_file_name.endswith(".bat"):
            batch_file_name += ".bat"

        try:
            self.show_progress_popup()
            threading.Thread(target=self.write_batch_file, args=(batch_file_name,), daemon=True).start()
            return True
        except Exception as e:
            print("Error:", e)
            messagebox.showerror("Error", f"An error occurred: {e}")
            self.close_progress_popup()
            return False

    def write_batch_file(self, batch_file_name):
        try:
            scene_frames = self.get_scene_frames()
            total_frames = len(scene_frames)

            # Open batch file for writing
            with open(os.path.join(self.batch_file_path, batch_file_name), "w") as file:
                for index, (scene, start_frame, end_frame) in enumerate(scene_frames):
                    command = f"\"{self.render_executable_path}\""

                    # Case if custom Scene frame range was provided
                    if start_frame is not None and end_frame is not None:
                        command += f" -s {start_frame} -e {end_frame}"

                    command += f" -rd \"{self.output_folder.replace('/', '\\')}\" \"{scene.replace('/', '\\')}\"\n"

                    file.write(command)

                    # Update progress bar
                    self.update_progress_bar(index + 1, total_frames)
                    self.root.after(0)

                self.close_progress_popup()
                # After writing is done, show message box in the main thread
                open_directory = self.root.after(0, lambda: messagebox.askyesno("Completed",
                                                                                "Batch File generated successfully! Saved to directory: \n" + self.batch_file_path + "\nDo you want to open the directory now?"))

                if open_directory:
                    os.startfile(self.batch_file_path)

                self.batch_file_written = True
                self.run_batch_button.config(state="normal")
        except Exception as e:
            print("Error:", e)
            messagebox.showerror("Error", f"An error occurred: {e}")

    def show_progress_popup(self):
        # Create a new frame inside the root window for the progress popup
        self.progress_frame = tk.Frame(self.root, bg="#333333", bd=2, relief="solid")
        self.progress_frame.place(relx=0.5, rely=0.5, anchor=tk.CENTER, width=300, height=100)

        # Add label and progress bar inside the frame
        label = tk.Label(self.progress_frame, text="Writing batch file...", bg="#333333", fg="white")
        label.pack(pady=10)

        self.progress_bar = ttk.Progressbar(self.progress_frame, orient=tk.HORIZONTAL, length=200, mode='indeterminate')
        self.progress_bar.pack(pady=10)

        # Start the progress bar
        self.progress_bar.start()

    def close_progress_popup(self):
        # Stop the progress bar and remove the progress frame
        self.progress_bar.stop()
        self.progress_frame.destroy()

    def update_progress_bar(self, current, total):
        # Update the progress bar's value based on current progress
        progress_value = (current / total) * 100
        self.progress_bar['value'] = progress_value

    def run_batch_file(self):
        batch_file_name = self.batch_file_name_entry.get()
        if not batch_file_name.endswith(".bat"):
            batch_file_name += ".bat"
        self.batch_file_path = os.path.join(self.batch_file_path, batch_file_name)
        print(self.batch_file_path)
        if os.path.exists(self.batch_file_path):
            batch_dir = os.path.dirname(self.batch_file_path)  # Get the directory containing the batch file
            p = Popen(batch_file_name, shell=True, cwd=batch_dir)
            print("run executed")
        else:
            messagebox.showerror("Error", "Batch file not found.")

    def open_help_dialog(self):
        help_text = ("Render.exe Path: Path to the Autodesk Maya Render.exe file.\n" +
                     "\n" +
                     "Output Folder: Path where the render results will be saved to.\n" +
                     "\n" +
                     "Batch File Directory: Path where the batch file with the render instructions will be stored. Execute after you generate the file to start the rendering process.\n" +
                     "\n" +
                     "Render Scenes: Select the scenes that you want to add to the render list." +
                     "\n" +
                     "If no custom Start and End Frame were set, the default render settings will be used.\n")
        messagebox.showinfo("Help", help_text)

def main():
    app = RenderManager()
    app.run()


if __name__ == "__main__":
    main()