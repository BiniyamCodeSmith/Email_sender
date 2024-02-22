#!/bin/bash

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to send email
send_email() {
  local sender="$1"       
  local password="$2"    
  local recipient="$3"   
  local subject="$4"      
  local body="$5"         
  local attachment="$6"  

  # Check if the 'mail' command exists
  if ! command_exists "mail"; then
    echo "Error: 'mail' command not found. Install mailutils package."
    exit 1
  fi

  # Check if an attachment is provided and if it exists
  if [ -n "$attachment" ]; then
    if [ ! -f "$attachment" ]; then
      echo "Error: Attachment '$attachment' not found."
      exit 1
    fi
    # Send email with attachment
    echo "$body" | mail -s "$subject" -a "$attachment" -S smtp="smtp://$sender:$password@smtp.gmail.com" "$recipient"
  else
    # Send email without attachment
    echo "$body" | mail -s "$subject" -S smtp="smtp://$sender:$password@smtp.gmail.com" "$recipient"
  fi

  # Check if email sending was successful
  if [ $? -eq 0 ]; then
    echo "Email sent successfully."
  else
    echo "Failed to send email."
  fi
}

# Main script
main() {
  # Prompt user for input
  read -p "Enter sender email (e.g., youremail@gmail.com): " sender
  read -s -p "Enter sender password: " password
  echo
  read -p "Enter recipient email: " recipient
  read -p "Enter email subject: " subject
  read -p "Enter email body: " body
  read -p "Enter path to attachment file (leave blank for none): " attachment

  # Call function to send email
  send_email "$sender" "$password" "$recipient" "$subject" "$body" "$attachment"
}

# Execute main script
main
