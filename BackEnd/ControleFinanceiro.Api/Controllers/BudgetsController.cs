using ControleFinanceiro.Application.Budgets.GetBudgets;
using ControleFinanceiro.Application.Budgets.UpsertBudget;
using Microsoft.AspNetCore.Mvc;

namespace ControleFinanceiro.Api.Controllers;

[ApiController]
[Route("api/budgets")]
public sealed class BudgetsController : ControllerBase
{
    private readonly GetBudgetsHandler _get;
    private readonly UpsertBudgetHandler _upsert;

    public BudgetsController(
        GetBudgetsHandler get,
        UpsertBudgetHandler upsert)
    {
        _get = get;
        _upsert = upsert;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int year, [FromQuery] int month, CancellationToken ct)
    {
        var result = await _get.Handle(new GetBudgetsQuery(year, month), ct);
        return Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> Put([FromBody] UpsertBudgetCommand cmd, CancellationToken ct)
    {
        await _upsert.Handle(cmd, ct);
        return NoContent();
    }
}