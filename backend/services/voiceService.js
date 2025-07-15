const OpenAI = require('openai');





//a function to make a request to the openai api and return the response. Provide the prompt and the tools to use.
async function processCommand(command) {
  try {
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
          description: "Log ALL exercise activities from a single voice command. Use this ONCE per command to log all exercises mentioned, even if multiple exercises are described. Consolidate all exercises into a single call.",
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



    let maxFollowUpRounds = 3;
    let roundsCompleted = 0;
    let currentMessages = []
    let currentResponse;
    let shouldContinue = true;

    const systemPrompt = `You are an AI assistant that processes voice commands for fitness activities. 
    You have access to two tools:
    
    1. log_exercise: Use this ONLY when the user explicitly mentions exercises they performed (e.g., "I did 15 push-ups and 20 squats" = ONE log_exercise call with both exercises)
    2. set_interval_timer: Use this ONLY when the user explicitly mentions intervals, timers, or timing-based activities (e.g., "5 intervals of 5 seconds", "10 intervals of 30 seconds with 2 minute breaks")
    
    CRITICAL RULES:
    - You must make EXACTLY ONE log_exercise call per voice command, regardless of how many exercises are mentioned
    - Never make multiple log_exercise calls for the same command
    - ONLY call tools when the user explicitly mentions the relevant activities
    - Do NOT make assumptions or call tools for activities not mentioned
    
    Examples of when to call log_exercise:
    - "I did bench press and crunches" → ONE log_exercise call with both exercises
    - "I completed 10 push-ups, 15 squats, and 5 pull-ups" → ONE log_exercise call with all three exercises
    - "Bench press with 185 lbs and some crunches" → ONE log_exercise call with both exercises
    
    Examples of when to call set_interval_timer:
    - "5 intervals of 30 seconds" → ONE set_interval_timer call
    - "10 rounds of 45 seconds with 1 minute breaks" → ONE set_interval_timer call
    
    Examples of when NOT to call tools:
    - "I did some push-ups and squats" → ONLY log_exercise (no intervals mentioned)
    - "I worked out" → NO tools (too vague)
    - "I exercised" → NO tools (too vague)
    
    Analyze the voice command and call ONLY the appropriate tool(s) for activities explicitly mentioned. Do not infer or assume activities not stated by the user.
    
    For exercises:
    - Extract exercise name, reps, sets, weight, and duration
    - Convert exercise names to standardized format
    - Identify muscle groups for each exercise
    - Handle multiple exercises in one command by putting them all in a single exercises array
    - If multiple exercises are mentioned, include ALL of them in the same log_exercise call
    
    For intervals:
    - Extract number of intervals, interval duration, and break duration
    - Calculate total duration
    - Provide a clear description
    
    Only call tools when the user explicitly mentions the relevant activities.`;

    //first response
    const firstResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: command }
      ],
      tools: tools
    });


    console.log('\n🤖 AI Response Summary:');
    console.log(`   Model: ${firstResponse.model}`);
    console.log(`   Tool Calls: ${firstResponse.choices[0].message.tool_calls?.length || 0}`);
    console.log(`   Has Content: ${firstResponse.choices[0].message.content ? 'Yes' : 'No'}`);

    currentResponse = firstResponse;

    //tool result accumulator
    const allToolResults = [];

    //process tool results in a loop with a maximum number of iterations
    while (shouldContinue && roundsCompleted < maxFollowUpRounds) {
      const currentMessage = currentResponse.choices[0].message;

      console.log(`\n🔄 Round ${roundsCompleted + 1}:`);

      //if no tool calls, exit the loop
      if (!currentMessage.tool_calls || currentMessage.tool_calls.length === 0) {
        console.log('   ✅ No more tool calls - finishing up');
        shouldContinue = false;
        break;
      }

      console.log(`   📞 Processing ${currentMessage.tool_calls.length} tool call(s)`);

      const toolResults = await Promise.all(currentMessage.tool_calls.map(async (toolCall) => {
        const output = await executeToolCall(toolCall);
        return { tool_call_id: toolCall.id, name: toolCall.function.name, output: output.result };
      }));

      console.log('   📋 Tool Results:');
      toolResults.forEach((result, index) => {
        console.log(`      ${index + 1}. ${result.name}: ${result.output.message}`);
        if (result.output.data) {
          console.log(`         Data: ${JSON.stringify(result.output.data, null, 2).replace(/\n/g, '\n         ')}`);
        }
      });

      //accumulate tool results
      allToolResults.push(...toolResults);

      //add assistant message to the current messages
      currentMessages.push(currentMessage);

      //add tool response to the conversation
      const toolResponseMessages = toolResults.map(result => ({
        role: "tool",
        tool_call_id: result.tool_call_id,
        name: result.name,
        content: JSON.stringify(result.output)
      }));

      currentMessages.push(...toolResponseMessages);

      console.log(`   💬 Conversation length: ${currentMessages.length} messages`);

      if (roundsCompleted < maxFollowUpRounds - 1) {
        //make follow up request if not at max rounds
        const followUpResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...currentMessages
          ],
          tools: tools
        });

        currentResponse = followUpResponse;
        roundsCompleted++;

      } else {
        //final round, just get response without tools
        const finalResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...currentMessages
          ],
        });
        currentResponse = finalResponse;
        shouldContinue = false;
      }

    }



    console.log('\n✅ Processing Complete:');
    console.log(`   Total Rounds: ${roundsCompleted}`);
    console.log(`   Total Tool Results: ${allToolResults.length}`);
    console.log(`   Final Message: ${currentResponse.choices[0].message.content ? 'Has content' : 'No content'}`);

    return {
      message: currentResponse.choices[0].message,
      model: currentResponse.model,
      toolResults: allToolResults,
      actionRounds: roundsCompleted
    };
  } catch (error) {
    console.error('Error making request to OpenAI:', error);
    throw error;
  }
}

//execute a tool call
async function executeToolCall(toolCall) {
  let name = toolCall.function.name;
  let arguments = toolCall.function.arguments;
  let result;
  try {
    switch (name) {

      case 'log_exercise':
        const exerciseData = JSON.parse(arguments);
        console.log(`      📝 Executing log_exercise with ${exerciseData.exercises?.length || 0} exercise(s)`);
        result = {
          success: true,
          message: `Successfully logged ${exerciseData.exercises?.length || 0} exercise(s)`,
          data: exerciseData
        };
        break;

      case 'set_interval_timer':
        const timerData = JSON.parse(arguments);
        console.log(`      ⏱️ Executing set_interval_timer: ${timerData.intervals} intervals of ${timerData.intervalDuration}s`);
        result = {
          success: true,
          message: `Timer set: ${timerData.intervals} intervals of ${timerData.intervalDuration}s`,
          data: timerData
        };
        break;

      default:
        throw new Error(`Unknown tool ${name}`);
    }
    return { result, name };
  } catch (error) {
    console.error('Error executing tool call:', error);
    throw error;
  }
}

module.exports = {
  processCommand
}; 