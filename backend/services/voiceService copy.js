const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the tools (functions) that the AI can call
const tools = [
  {
    type: "function",
    function: {
      name: "log_exercise",
      description: "Log exercise activities from voice commands. Use this when the user mentions exercises they performed.",
      parameters: {
        type: "object",
        properties: {
          exercises: {
            type: "array",
            description: "Array of exercises to log",
            items: {
              type: "object",
              properties: {
                exercise: {
                  type: "string",
                  description: "Name of the exercise (e.g., 'push-ups', 'squats', 'deadlifts')"
                },
                reps: {
                  type: ["number", "null"],
                  description: "Number of repetitions performed"
                },
                sets: {
                  type: ["number", "null"],
                  description: "Number of sets performed"
                },
                weight: {
                  type: ["number", "null"],
                  description: "Weight used in pounds or kilograms"
                },
                duration: {
                  type: ["number", "null"],
                  description: "Duration in minutes"
                },
                muscleGroups: {
                  type: "array",
                  items: {
                    type: "string"
                  },
                  description: "Muscle groups targeted by this exercise"
                },
                confidence: {
                  type: "number",
                  minimum: 0,
                  maximum: 1,
                  description: "Confidence level in the extracted data (0-1)"
                }
              },
              required: ["exercise", "reps", "sets", "weight", "duration", "muscleGroups", "confidence"]
            }
          }
        },
        required: ["exercises"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "set_interval_timer",
      description: "Set up interval timers for workouts. Use this when the user mentions intervals, timers, or timing-based activities.",
      parameters: {
        type: "object",
        properties: {
          intervals: {
            type: "number",
            description: "Number of intervals to perform"
          },
          intervalDuration: {
            type: "number",
            description: "Duration of each interval in seconds"
          },
          breakDuration: {
            type: ["number", "null"],
            description: "Duration of break between intervals in seconds (null if no break)"
          },
          totalDuration: {
            type: "number",
            description: "Total duration of all intervals and breaks in seconds"
          },
          description: {
            type: "string",
            description: "Human-readable description of the timer setup"
          }
        },
        required: ["intervals", "intervalDuration", "totalDuration", "description"]
      }
    }
  }
];

/**
 * Process voice command using OpenAI function calling
 * @param {string} voiceCommand - The voice command to process
 * @param {string} userId - User ID for logging
 * @returns {Object} Processed result from AI tools
 */
async function processVoiceCommand(voiceCommand, userId) {
  try {
    console.log(`🤖 Processing voice command with OpenAI tools: "${voiceCommand}"`);
    
    const systemPrompt = `You are an AI assistant that processes voice commands for fitness activities. 
    You have access to two tools:
    
    1. log_exercise: Use this when the user mentions exercises they performed (e.g., "I did 15 push-ups", "I completed 3 sets of squats")
    2. set_interval_timer: Use this when the user mentions intervals or timers (e.g., "5 intervals of 5 seconds", "10 intervals of 30 seconds with 2 minute breaks")
    
    Analyze the voice command and call the appropriate tool(s). If the command mentions both exercises and intervals, you can call both tools.
    
    For exercises:
    - Extract exercise name, reps, sets, weight, and duration
    - Convert exercise names to standardized format
    - Identify muscle groups for each exercise
    - Handle multiple exercises in one command
    
    For intervals:
    - Extract number of intervals, interval duration, and break duration
    - Calculate total duration
    - Provide a clear description
    
    Always call the appropriate tool(s) based on the user's command.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: voiceCommand }
      ],
      tools: tools,
      tool_choice: "auto",
      temperature: 0.1,
      max_tokens: 1000
    });
    
    const response = completion.choices[0].message;
    console.log(`🤖 OpenAI response:`, JSON.stringify(response, null, 2));

    // Check if the AI called any tools
    if (!response.tool_calls || !Array.isArray(response.tool_calls) || response.tool_calls.length === 0) {
      console.log(`📝 No tool calls found in response. Response structure:`, {
        hasToolCalls: !!response.tool_calls,
        toolCallsType: typeof response.tool_calls,
        isArray: Array.isArray(response.tool_calls),
        toolCallsLength: response.tool_calls ? response.tool_calls.length : 'undefined',
        responseContent: response.content,
        finishReason: response.finish_reason
      });
      
      // If there's content in the response, return it as a message
      if (response.content) {
        return {
          success: true,
          message: response.content,
          type: "text_response",
          debug: {
            responseContent: response.content,
            finishReason: response.finish_reason
          }
        };
      }
      
      return {
        success: true,
        message: "No specific action needed for this command",
        type: "no_action",
        debug: {
          responseContent: response.content,
          finishReason: response.finish_reason
        }
      };
    }

    // Process each tool call
    const results = [];
    
    try {
      for (const toolCall of response.tool_calls) {
        if (!toolCall.function || !toolCall.function.name || !toolCall.function.arguments) {
          console.warn(`Invalid tool call structure:`, toolCall);
          continue;
        }
        
        const functionName = toolCall.function.name;
        let functionArgs;
        
        try {
          functionArgs = JSON.parse(toolCall.function.arguments);
        } catch (parseError) {
          console.error(`Failed to parse function arguments for ${functionName}:`, parseError);
          continue;
        }
        
        console.log(`🔧 Calling tool: ${functionName} with args:`, JSON.stringify(functionArgs, null, 2));
        
        let result;
        
        switch (functionName) {
          case 'log_exercise':
            result = await handleLogExercise(functionArgs, userId, voiceCommand);
            break;
          case 'set_interval_timer':
            result = await handleSetIntervalTimer(functionArgs, userId, voiceCommand);
            break;
          default:
            console.warn(`Unknown tool called: ${functionName}`);
            continue;
        }
        
        results.push({
          tool: functionName,
          result: result
        });
      }
    } catch (toolError) {
      console.error('Error processing tool calls:', toolError);
      throw new Error(`Failed to process tool calls: ${toolError.message}`);
    }

    return {
      success: true,
      results: results,
      message: `Processed ${results.length} action(s) from voice command`
    };

  } catch (error) {
    console.error('Voice processing error:', error);
    
    if (error.code === 'insufficient_quota') {
      throw new Error('AI service quota exceeded');
    }
    
    if (error.code === 'invalid_api_key') {
      throw new Error('Invalid AI service configuration');
    }
    
    throw new Error('Failed to process voice command');
  }
}

/**
 * Handle log_exercise tool call
 * @param {Object} functionArgs - Arguments from the AI tool call
 * @param {string} userId - User ID for logging
 * @param {string} voiceCommand - Original voice command
 * @returns {Object} Result of exercise logging
 */
async function handleLogExercise(functionArgs, userId, voiceCommand) {
  try {
    console.log(`💪 Processing exercise logging:`, JSON.stringify(functionArgs, null, 2));
    
    // Validate the exercise data
    const validatedExercises = validateExerciseData(functionArgs);
    
    // Add metadata to each exercise
    const exercisesWithMetadata = validatedExercises.map(exercise => ({
      ...exercise,
      userId,
      date: new Date().toISOString(),
      originalCommand: voiceCommand,
      processedAt: new Date().toISOString()
    }));

    console.log(`✅ Successfully processed ${exercisesWithMetadata.length} exercise(s): ${exercisesWithMetadata.map(e => e.exercise).join(', ')}`);
    
    // Save all exercises to database
    const savedExercises = await Promise.all(
      exercisesWithMetadata.map(exercise => saveExerciseToDatabase(exercise))
    );

    return {
      success: true,
      exercises: savedExercises,
      count: savedExercises.length,
      message: `Successfully logged ${savedExercises.length} exercise(s): ${savedExercises.map(e => e.exercise).join(', ')}`
    };
  } catch (error) {
    console.error('Exercise logging error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to log exercises'
    };
  }
}

/**
 * Handle set_interval_timer tool call
 * @param {Object} functionArgs - Arguments from the AI tool call
 * @param {string} userId - User ID for logging
 * @param {string} voiceCommand - Original voice command
 * @returns {Object} Result of timer setup
 */
async function handleSetIntervalTimer(functionArgs, userId, voiceCommand) {
  try {
    console.log(`⏱️ Processing interval timer setup:`, JSON.stringify(functionArgs, null, 2));
    
    // Validate timer data
    const validatedTimer = validateTimerData(functionArgs);
    
    // Add metadata
    const timerWithMetadata = {
      ...validatedTimer,
      userId,
      date: new Date().toISOString(),
      originalCommand: voiceCommand,
      processedAt: new Date().toISOString()
    };

    console.log(`✅ Successfully set up interval timer: ${timerWithMetadata.description}`);
    
    // Save timer to database
    const savedTimer = await saveTimerToDatabase(timerWithMetadata);

    return {
      success: true,
      timer: savedTimer,
      message: `Successfully set up interval timer: ${savedTimer.description}`
    };
  } catch (error) {
    console.error('Timer setup error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to set up interval timer'
    };
  }
}

/**
 * Validate and clean exercise data
 * @param {Object} data - Raw exercise data from AI
 * @returns {Array} Array of validated exercise data
 */
function validateExerciseData(data) {
  // Check if data has exercises array
  if (!data.exercises || !Array.isArray(data.exercises)) {
    throw new Error('Invalid response format: missing exercises array');
  }

  const required = ['exercise', 'reps', 'sets', 'weight', 'duration', 'muscleGroups', 'confidence'];
  
  return data.exercises.map((exercise, index) => {
    // Check for required fields
    for (const field of required) {
      if (!(field in exercise)) {
        throw new Error(`Missing required field '${field}' in exercise ${index + 1}`);
      }
    }

    // Clean and validate exercise name
    if (!exercise.exercise || typeof exercise.exercise !== 'string') {
      throw new Error(`Invalid exercise name in exercise ${index + 1}`);
    }

    // Normalize exercise name
    const normalizedExercise = exercise.exercise.toLowerCase().trim();
    
    // Validate numeric fields
    const reps = exercise.reps !== null ? parseInt(exercise.reps) : null;
    const sets = exercise.sets !== null ? parseInt(exercise.sets) : null;
    const weight = exercise.weight !== null ? parseFloat(exercise.weight) : null;
    const duration = exercise.duration !== null ? parseInt(exercise.duration) : null;
    
    // Validate confidence
    const confidence = Math.max(0, Math.min(1, parseFloat(exercise.confidence) || 0));

    // Validate muscle groups
    const muscleGroups = Array.isArray(exercise.muscleGroups) ? exercise.muscleGroups : [];

    return {
      exercise: normalizedExercise,
      reps,
      sets,
      weight,
      duration,
      muscleGroups,
      confidence
    };
  });
}

/**
 * Validate and clean timer data
 * @param {Object} data - Raw timer data from AI
 * @returns {Object} Validated timer data
 */
function validateTimerData(data) {
  const required = ['intervals', 'intervalDuration', 'totalDuration', 'description'];
  
  for (const field of required) {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate numeric fields
  const intervals = parseInt(data.intervals);
  const intervalDuration = parseInt(data.intervalDuration);
  const breakDuration = data.breakDuration !== null ? parseInt(data.breakDuration) : null;
  const totalDuration = parseInt(data.totalDuration);
  
  if (isNaN(intervals) || intervals <= 0) {
    throw new Error('Invalid number of intervals');
  }
  
  if (isNaN(intervalDuration) || intervalDuration <= 0) {
    throw new Error('Invalid interval duration');
  }
  
  if (isNaN(totalDuration) || totalDuration <= 0) {
    throw new Error('Invalid total duration');
  }

  return {
    intervals,
    intervalDuration,
    breakDuration,
    totalDuration,
    description: data.description
  };
}

/**
 * Save exercise data to database (placeholder for now)
 * @param {Object} exerciseData - Validated exercise data
 */
async function saveExerciseToDatabase(exerciseData) {
  // TODO: Implement actual database save
  console.log(`💾 Saving exercise to database: ${JSON.stringify(exerciseData, null, 2)}`);
  
  // Simulate database save
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`✅ Exercise saved to database`);
      resolve(exerciseData);
    }, 100);
  });
}

/**
 * Save timer data to database (placeholder for now)
 * @param {Object} timerData - Validated timer data
 */
async function saveTimerToDatabase(timerData) {
  // TODO: Implement actual database save
  console.log(`💾 Saving timer to database: ${JSON.stringify(timerData, null, 2)}`);
  
  // Simulate database save
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`✅ Timer saved to database`);
      resolve(timerData);
    }, 100);
  });
}

/**
 * Get exercise suggestions based on user history
 * @param {string} userId - User ID
 * @returns {Array} Suggested exercises
 */
async function getExerciseSuggestions(userId) {
  // TODO: Implement based on user history and preferences
  return [
    'push-ups',
    'squats',
    'planks',
    'burpees',
    'lunges'
  ];
}

module.exports = {
  processVoiceCommand,
  getExerciseSuggestions
}; 