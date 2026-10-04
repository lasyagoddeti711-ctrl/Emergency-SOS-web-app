# 🚨 Emergency SOS & Blood Donation Web App

An emergency assistance web application designed to provide **quick, accessible, and privacy-conscious support during critical situations**. The application combines an **Emergency SOS system** with a **Blood Donation Request platform** to connect people in need with appropriate help.

## 🌟 Features

### 🚨 Emergency SOS

The application provides an emergency SOS button designed to reduce accidental emergency alerts while ensuring that users have enough time to cancel a request.

* **One-click Emergency SOS button**
* **60-second cancellation window** after activating SOS
* During the 60-second window:

  * 🔊 An emergency **sound alert** is enabled.
  * 💡 A **blinking visual light** is activated to make the emergency alert visible.
* The blinking light provides an additional way to identify an active emergency, especially for people who may not be able to hear the audio alert.
* Users can **cancel the SOS request within 60 seconds** if it was triggered accidentally.
* If the SOS is not cancelled within the 60-second window, the user's **location is automatically shared with a nearby hospital/emergency service**.

### 🩸 Blood Donation System

The application also provides resources for people who need blood and helps connect them with compatible blood donors.

#### For people needing blood

* Users can **raise a blood donation request**.
* The request contains the necessary information required to find a compatible donor.
* Compatible donors are notified about the request.

#### For blood donors

* Donors can receive requests that match their **blood group/compatibility requirements**.
* Donors can choose whether to **accept or decline** a request.
* The recipient's and donor's contact information is **not immediately exposed**.

### 🔐 Privacy Protection

User privacy is an important part of the application.

* Contact information is **not publicly displayed**.
* Contact details are shared **only after a compatible donor accepts the blood request**.
* Blood requests are shared with relevant compatible donors rather than exposing personal information to everyone.
* The system is designed to minimize unnecessary exposure of users' personal information.

## 🔄 How the Emergency SOS Works

```text
User presses SOS
       ↓
60-second cancellation window starts
       ↓
 ┌───────────────────────────────┐
 │  🔊 Sound Alert Enabled       │
 │  💡 Blinking Light Enabled    │
 │  ⏱️ 60-second Countdown       │
 └───────────────────────────────┘
       ↓
   User cancels?
      /     \
    YES      NO
     ↓        ↓
  SOS ends   Location shared
             with nearby
             hospital/emergency
             service
```

## 🩸 How Blood Donation Requests Work

```text
Person needs blood
        ↓
Raises blood request
        ↓
System checks blood compatibility
        ↓
Compatible donors receive request
        ↓
Donor accepts / declines
        ↓
     Accepts?
      /    \
    NO      YES
    ↓        ↓
 Request    Contact information
 ends       is shared
            securely
```

## 🎯 Purpose

The goal of this project is to create a simple emergency-support platform that can:

* Provide a quick way to initiate emergency assistance.
* Reduce accidental SOS activations.
* Provide both **audio and visual emergency indicators**.
* Automatically communicate the user's location when an emergency is confirmed.
* Help people find compatible blood donors.
* Protect users' personal and contact information.

## 🛠️ Technologies Used

* **React.js** — Frontend user interface
* **JavaScript** — Application logic and functionality
* **HTML5** — Application structure
* **CSS3** — Styling and responsive design
* **Node.js** — Backend runtime
* **Express.js** — Backend API and server
* **MongoDB** — Database for storing application data
* **Socket.IO** — Real-time communication and instant updates between users and the server
* **Sandbox Technology** — Secure and isolated environment for application functionality and testing

## 🚀 Future Improvements

Some possible improvements include:

* Integration with real hospitals and emergency services.
* Real-time GPS location tracking.
* SMS/call notifications to emergency contacts.
* Push notifications for blood donors.
* Advanced donor matching based on location and availability.
* Hospital-side emergency dashboard.
* Authentication and role-based access control.
* Real-time status tracking for emergency and blood requests.

## ⚠️ Disclaimer

This project is developed for educational and demonstration purposes. Emergency location sharing and hospital communication should be connected to verified emergency-service infrastructure before being used in real-world emergency situations.

## 👩‍💻 Project

**Emergency SOS & Blood Donation Web App**

Built to explore how technology can help provide faster emergency assistance while maintaining user privacy.
