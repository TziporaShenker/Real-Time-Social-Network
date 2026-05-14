import React, { useState } from "react";
import {
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import api from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";

/**
 * Register Component
 * Handles new user registration, encompassing local input validation, 
 * API communication for account creation, and automatic session initialization (login).
 */
const Register = () => {
  // State management for the registration form input fields
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  });

  const { login } = useAuth();

  // State to track and display registration errors returned by the server
  const [error, setError] = useState("");

  // State to track client-side form validation errors for immediate user feedback
  const [formErrors, setFormErrors] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  });

  const navigate = useNavigate();

  /**
   * Validates user inputs locally prior to submitting the registration request.
   * Updates the formErrors state with specific messages if validation criteria are not met.
   * 
   * @returns {boolean} True if all form fields pass validation, false otherwise.
   */
  const validateInputs = () => {
    let isValid = true;
    const newErrors = {
      username: "",
      email: "",
      password: "",
      first_name: "",
      last_name: "",
    };

    // Validate Username: Must exist and meet minimum length requirements
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
      isValid = false;
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
      isValid = false;
    }

    // Validate First Name: Must not be empty
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
      isValid = false;
    }

    // Validate Last Name: Must not be empty
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
      isValid = false;
    }

    // Validate Email: Check for presence and correct structural format using a Regular Expression
    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    // Validate Password: Must exist and meet minimum security length requirements
    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    // Update the UI with any identified validation errors
    setFormErrors(newErrors);
    return isValid;
  };

  /**
   * Handles the registration form submission event.
   * Orchestrates validation, account creation, automatic login, and routing.
   * 
   * @param {React.FormEvent} e - The default form submission event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Reset any pre-existing server error messages

    // Halt execution immediately if client-side validation fails
    if (!validateInputs()) {
      return;
    }

    try {
      // Normalize the email to lowercase to ensure consistency in the database
      const normalizedData = {
        ...formData,
        email: formData.email.toLowerCase(),
      };

      // Dispatch the POST request to create the new user account
      await api.post("/auth/register", normalizedData);
      
      // Automatically log the user in immediately after successful registration
      const loginResponse = await api.post("/auth/login", {
        email: normalizedData.email,
        password: formData.password,
      });
      
      const { accessToken, user } = loginResponse.data;
      
      // Update the global authentication context to establish the session
      login(accessToken, user);
      
      // Redirect the newly authenticated user to the main feed
      navigate("/feed");
    } catch (err: any) {
      // Capture and display error messages provided by the server (e.g., "Email already exists")
      setError(err.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          mt: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* --- Brand Header --- */}
        <Typography
          variant="h4"
          color="primary"
          sx={{ mb: 4, fontWeight: "bold" }}
        >
          Linked
          <span
            style={{
              backgroundColor: "#0a66c2",
              color: "white",
              padding: "0 4px",
              borderRadius: "4px",
            }}
          >
            in
          </span>
        </Typography>

        {/* --- Registration Form Card --- */}
        <Card sx={{ width: "100%", p: 2 }}>
          <CardContent>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Join LinkedIn
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Make the most of your professional life
            </Typography>

            {/* Server-Side Error Alert Display */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                label="Username"
                margin="normal"
                required
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                error={!!formErrors.username} // Triggers the MUI error state (red border)
                helperText={formErrors.username} // Renders the specific validation error message
              />
              <TextField
                fullWidth
                label="First Name"
                margin="normal"
                required
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                error={!!formErrors.first_name}
                helperText={formErrors.first_name}
              />
              <TextField
                fullWidth
                label="Last Name"
                margin="normal"
                required
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                error={!!formErrors.last_name}
                helperText={formErrors.last_name}
              />
              <TextField
                fullWidth
                label="Email"
                margin="normal"
                required
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
              <TextField
                fullWidth
                label="Password"
                margin="normal"
                required
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                error={!!formErrors.password}
                helperText={formErrors.password}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                sx={{ mt: 3, py: 1.5 }}
              >
                Agree & Join
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* --- Login Redirection --- */}
        <Typography variant="body2" sx={{ mt: 3 }}>
          Already on LinkedIn?{" "}
          <Link component={RouterLink} to="/login" sx={{ fontWeight: 600 }}>
            Sign in
          </Link>
        </Typography>
      </Box>
    </Container>
  );
};

export default Register;