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
import { useAuth } from "../context/AuthContext";
import api from "../api/axiosConfig";
import { useNavigate, Link as RouterLink } from "react-router-dom";

/**
 * Login Component
 * Handles user authentication by capturing credentials, performing client-side validation,
 * and communicating with the authentication API.
 */
const Login = () => {
  // State management for user credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // State to track and display authentication errors returned by the server
  const [error, setError] = useState("");

  // State to track client-side form validation errors for immediate user feedback
  const [formErrors, setFormErrors] = useState({ email: "", password: "" });

  const { login } = useAuth();
  const navigate = useNavigate();

  /**
   * Validates user inputs locally before dispatching the login request to the server.
   * Updates the formErrors state with specific messaging if validation fails.
   * 
   * @returns {boolean} True if all inputs are valid, false otherwise.
   */
  const validateInputs = () => {
    let isValid = true;
    const newErrors = { email: "", password: "" };

    // Validate Email: Check for presence and correct structural format using a Regular Expression
    if (!email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    // Validate Password: Ensure the field is not empty prior to submission
    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    // Update the UI with any identified errors
    setFormErrors(newErrors);
    return isValid;
  };

  /**
   * Handles the form submission event.
   * Orchestrates validation, API communication, and context updates upon a successful login.
   * 
   * @param {React.FormEvent} e - The default form submission event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Reset any pre-existing server error messages upon a new submission attempt

    // Halt execution immediately if client-side validation fails
    if (!validateInputs()) {
      return; 
    }

    try {
      // Dispatch the POST request to the authentication endpoint
      // Normalize the email to lowercase to prevent case-sensitivity issues during login
      const response = await api.post("/auth/login", {
        email: email.toLowerCase(), 
        password,
      });
      
      const { accessToken, user } = response.data;
      
      // Update the global authentication context and establish the session
      login(accessToken, user);
      
      // Redirect the authenticated user to the main feed application
      navigate("/feed");
    } catch (err: any) {
      // Capture and display error messages provided by the server, falling back to a generic message
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          mt: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* --- Brand Header --- */}
        <Typography
          variant="h4"
          color="primary"
          sx={{
            mb: 4,
            fontWeight: "bold",
          }}
        >
          Linked
          <span
            style={{
              backgroundColor: "#0a66c2",
              color: "white",
              padding: "0 4px",
              borderRadius: "4px",
              marginLeft: "2px",
            }}
          >
            in
          </span>
        </Typography>

        {/* --- Login Form Card --- */}
        <Card sx={{ width: "100%", p: 2 }}>
          <CardContent>
            <Typography variant="h5" sx={{ fontWeight: 600 }} gutterBottom>
              Sign in
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Stay updated on your professional world
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
                label="Email"
                variant="outlined"
                margin="normal"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!formErrors.email} // Triggers the MUI error state (red border) if an error exists
                helperText={formErrors.email} // Renders the specific validation error message below the input
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                margin="normal"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!formErrors.password}
                helperText={formErrors.password}
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* --- Registration Redirection --- */}
        <Typography variant="body2" sx={{ mt: 3 }}>
          New to LinkedIn?{" "}
          <Link
            component={RouterLink}
            to="/register"
            underline="hover"
            sx={{ fontWeight: 600 }}
          >
            Join now
          </Link>
        </Typography>
      </Box>
    </Container>
  );
};

export default Login;