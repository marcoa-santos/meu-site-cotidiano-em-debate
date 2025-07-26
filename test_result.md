#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Fix admin panel text issues, add file upload functionality to Ensino/Extensão forms, implement social sharing for Extension activities, and reorganize menu structure. Specifically: 1) Fix 'Nova Atividade de Extensão' text appearing in Ensino admin section, 2) Add file upload fields to Ensino/Extensão admin forms, 3) Implement social sharing for Extension activities, 4) Move product types from main menu into Pesquisa section."

backend:
  - task: "Admin panel text correction"
    implemented: false
    working: "NA"
    file: "server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Need to identify and fix incorrect 'Nova Atividade de Extensão' text in Ensino admin section"

  - task: "File upload for Ensino materials"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Backend already has material_file upload functionality for ensino endpoint (lines 615-639)"

  - task: "File upload for Extensão materials"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Need to add file upload functionality to extensão endpoint"
      - working: true
        agent: "testing"
        comment: "COMPREHENSIVE TESTING COMPLETED: ✅ POST /api/extensao endpoint with material_file upload works perfectly - files saved to uploads directory with proper naming (extensao_id_material.ext). ✅ GET /api/download-extensao/{extensao_id} endpoint working correctly - serves files with proper media types. ✅ Extensao model includes file field and image_file field. ✅ File validation working: rejects invalid file types (400 status), rejects oversized files >10MB (413 status). ✅ Supports multiple file types: .pdf, .ppt, .pptx, .doc, .docx, .zip. ✅ Existing functionality preserved: image upload, video_url, event_date all working. ✅ Can create extensão with or without files. All 6 extensão file upload tests passed successfully."

frontend:
  - task: "Fix admin panel text for Ensino form"
    implemented: false
    working: "NA"
    file: "App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Need to fix any incorrect text in EnsinoForm that shows 'Nova Atividade de Extensão'"

  - task: "Social sharing for Extension activities"
    implemented: true
    working: true
    file: "App.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Social sharing is already implemented in ExtensaoDetail component (lines 387-419)"

  - task: "Menu reorganization - move product types"
    implemented: false
    working: "NA"
    file: "App.js"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Need to move product type filters from main menu into Pesquisa section"

  - task: "Add file upload to Extensão admin form"
    implemented: true
    working: true
    file: "App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Need to add file upload field to ExtensaoForm for materials"
      - working: true
        agent: "main"
        comment: "Added material_file upload field to ExtensaoForm, updated form submission to handle files object, added download link in ExtensaoDetail"

  - task: "Menu reorganization - move product types"
    implemented: true
    working: true
    file: "App.js"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Need to move product type filters from main menu into Pesquisa section"
      - working: true
        agent: "main"
        comment: "Moved product type grid from homepage to products page, added category selection with visual feedback"

  - task: "Login credentials fix"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Fixed login credentials to marc0_santos/tda-8maq9, updated startup event to always ensure correct admin user exists"

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "Fix admin panel text for Ensino form"
    - "Add file upload to Extensão admin form"
    - "Menu reorganization - move product types"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Starting implementation of pending tasks. First priority: fix admin panel text issues and add file upload functionality."
  - agent: "main"
    message: "Completed major backend and frontend updates: 1) Added file upload to Extensão (backend + frontend), 2) Reorganized menu structure (moved product types to Pesquisa page), 3) Fixed login credentials. Backend testing shows all functionality working correctly."
  - agent: "testing"
    message: "EXTENSÃO FILE UPLOAD TESTING COMPLETED SUCCESSFULLY: All backend functionality for extensão file uploads is working perfectly. The POST /api/extensao endpoint supports material_file and image_file uploads, files are properly saved to uploads directory, download endpoint works correctly, file validation is robust (type and size limits), and existing functionality is preserved. Backend implementation is complete and fully functional. 28/28 backend tests passed including comprehensive extensão file upload tests."