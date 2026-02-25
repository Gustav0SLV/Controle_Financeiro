using ControleFinanceiro.Application.Incomes.GetMonthlyIncome;
using ControleFinanceiro.Application.Incomes.UpsertMonthlyIncome;
using Microsoft.AspNetCore.Mvc;

namespace ControleFinanceiro.Api.Controllers;

[ApiController]
[Route("api/income")]
public sealed class MonthlyIncomeController : ControllerBase
{
    [HttpGet("monthly")]
    public async Task<IActionResult> Get(
        [FromQuery] int year,
        [FromQuery] int month,
        [FromServices] GetMonthlyIncomeHandler handler,
        CancellationToken ct)
    {
        try
        {
            var dto = await handler.Handle(new GetMonthlyIncomeQuery(year, month), ct);
            return Ok(dto);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("monthly")]
    public async Task<IActionResult> Upsert(
        [FromBody] UpsertMonthlyIncomeRequest req,
        [FromServices] UpsertMonthlyIncomeHandler handler,
        CancellationToken ct)
    {
        try
        {
            await handler.Handle(new UpsertMonthlyIncomeCommand(req.Year, req.Month, req.Amount), ct);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    public sealed record UpsertMonthlyIncomeRequest(int Year, int Month, decimal Amount);
}